from google import genai
import sqlite3
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import jwt
import datetime
from functools import wraps
load_dotenv()

DB_PATH = "/Users/emmettyoung/Desktop/Personal/ai-tigers-technical/example.db"
VALID_EMAIL = "example@helloconstellation.com"
VALID_PASSWORD = "ConstellationInterview123!"

USERNAME = 'example user'
JWTKEY = "keyforjwt"

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing token"}), 401
        token = auth_header.split(" ")[1]
        try:
            jwt.decode(token, JWTKEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

def get_schema():
    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    schema = ""
    for (table_name,) in tables:
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        col_names = ", ".join([col[1] for col in columns])
        schema += f"Table: {table_name} | Columns: {col_names}\n"
    connection.close()
    return schema

def file_read():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    table_name = cursor.fetchone()[0]
    cursor.execute(f"SELECT * FROM {table_name};")
    rows = [dict(row) for row in cursor.fetchall()]
    connection.close()
    return rows

def run_query(sql):
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()
    cursor.execute(sql)
    rows = [dict(row) for row in cursor.fetchall()]
    connection.close()
    return rows

client = genai.Client()
app = Flask(__name__)
CORS(app)

@app.route("/api/login", methods=["POST"])
def login():
    body = request.get_json()
    username = body.get("username", "")
    password = body.get("password", "")
    if username == VALID_EMAIL and password == VALID_PASSWORD:
        token = jwt.encode({
            "username": username,
            "name": USERNAME,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)
        }, JWTKEY, algorithm="HS256")
        return jsonify({"success": True, "token": token, "name": USERNAME})
    return jsonify({"success": False, "error": "Invalid email or password"}), 401

@app.route("/api")
def get_status():
    return jsonify({"message": "backend is connected"})

@app.route("/api/table")
@token_required
def get_table():
    rows = file_read()
    return jsonify(rows)

@app.route("/api/query", methods=["POST"])
@token_required
def query_gemini():
    body = request.get_json()
    user_query = body.get("query", "")

    schema = get_schema()
    sql_prompt = f"""Given this database schema: {schema} Write a SQLite SQL query to
    answer this question: "{user_query}." Reply with only the SQL query, no explanation, no markdown, no backticks"""

    sql_response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=sql_prompt
    )

    sql = sql_response.text.strip()

    try:
        results = run_query(sql)
    except Exception as e:
        return jsonify({"answer": f"Failed to run query: {str(e)}", "sql": sql})

    answer_prompt = f"""A user asked: "{user_query}" The SQL query "{sql}"
    returned these results: {results} Give a clear, concise, human-readable answer 
    based only on these results."""

    answer_response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=answer_prompt
    )

    return jsonify({"answer": answer_response.text, "sql": sql})

if __name__ == "__main__":
    app.run(port=5001, host="0.0.0.0")