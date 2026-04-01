import { useState, useEffect } from "react"
import "./index.css"

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "")
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "")
  const [loginError, setLoginError] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const [rows, setRows] = useState([])
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [answer, setAnswer] = useState("")
  const [loadingQuery, setLoadingQuery] = useState(false)

  const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  }

  useEffect(() => {
    if (!token) return
    fetch("http://localhost:5001/api/table", { headers: authHeaders })
      .then((res) => {
        if (res.status === 401) { handleLogout(); return null }
        return res.json()
      })
      .then((data) => {
        if (!data) return
        setRows(data)
        if (data.length > 0) setColumns(Object.keys(data[0]))
      })
      .catch(() => setError("Could not connect to backend."))
      .finally(() => setLoading(false))
  }, [token])

  const handleLogin = async () => {
    const res = await fetch("http://localhost:5001/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (data.success) {
      localStorage.setItem("token", data.token)
      localStorage.setItem("userName", data.name)
      setToken(data.token)
      setUserName(data.name)
    } else {
      setLoginError("Invalid email or password")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userName")
    setToken("")
    setUserName("")
    setUsername("")
    setPassword("")
  }

  const handleQuery = async () => {
    if (!query.trim()) return
    setLoadingQuery(true)
    setAnswer("")
    try {
      const res = await fetch("http://localhost:5001/api/query", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ query }),
      })
      if (res.status === 401) { handleLogout(); return }
      const data = await res.json()
      setAnswer(data.answer)
    } catch {
      setAnswer("Error contacting backend.")
    } finally {
      setLoadingQuery(false)
    }
  }

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-box">
          <h2>Sign In</h2>
          <input
            type="text"
            placeholder="Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button onClick={handleLogin}>Login</button>
          {loginError && <p className="error">{loginError}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="layout">
      <div className="topbar">
        <img src="/constellationsoftware-icon.png" alt="logo" className="logo" />
        <div className="topbar-right">
          <span className="user-name">user: {userName}</span>
          <button className="logout-btn" onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <div className="panels">
        <div className="left-panel">
          <h2>Car Data</h2>
          {loading && <p>Loading...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>{columns.map((col) => <th key={col}>{col}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {columns.map((col) => <td key={col}>{row[col] ?? "—"}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="right-panel">
          <textarea
            className="query-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Query the data..."
            rows={4}
          />
          <button onClick={handleQuery} disabled={loadingQuery}>
            {loadingQuery ? "Thinking..." : "Query"}
          </button>
          {answer && <div className="answer-box"><p>{answer}</p></div>}
        </div>
      </div>
    </div>
  )
}