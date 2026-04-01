1. Infrastructure Write Up:

Technologies: For my backend I utilized flask for the creating an API endpoint as it was simply the format I was most comfortable with from classes I have taken at Brown. Organizationally, Flask is incredibly intuitive with its structure of "routes" as well as then, it also offers easy decoding mechanisms for when backend connections were faulty. 

Libraries: The libraries I used followed a similar intuitive path where I used the google library to connect gemeni,  then the dotenv so that I could connect my backend file with my environment file to keep the api key secure. For processing the database I simply used the sqlite library, utilizing specifically sqlite3 to process the database and then allow viewage. The next two libraries I used were simply for the login portion of the assignment. To log JWT tokens I used the PyJWT library and datetime. These allowed me to make sure all actions on the site had been authentication (token) before being preformed. The last library I used was CORS which was critical to the functionality of the program as it allowed for the ports to communicate with each other (front end being 3000, backend being 5001)

Authentication: When the user goes to the website they are prompted with a sign-in option where the only possible sign in (as provided) is hard-coded in the backend for security. From there, upon successful signing in the user is assigned a token that expires after 8 hours. The token allows the user to utilize the different functions of seeing the table as well as querying it. If the user were to log out the token would be removed. 

AI pipeline: Below the table you will see a query box as well as a query button. The user would input any query into the input box then click the query button to send the query. On the inside this looks the following:
- After the query button is clicked, gemini queries over the database for just table names and column names to provide context for a sql query without scanning the entire table. 
- Gemini then writes only a valid sql query that the function "run_query" takes in and runs through the sqlite database file
- The results from the run_query function are then sent back to gemini where gemini then returns a humanized version of the results

2. Scale & Production Design 

If this application was deployed to hundreds of people I would change the processing of database and querying. Currently I am using sqlite which is not sustainable under a real load. I would transition to a proper data base that would allow for more load. With that being said, the main stressor on the site would come from the gemini api queries so to accomodate to this I would create an event queue that would allow for asynch calls to be made and more queries to be handled at once. 

With regards to secruity, currently a lot of variables are hard coded into the files. If the site was meant to accomodate a larger load of users I would pivot to using a system that manage these variables that are meant to be secrets and unaccessible to users. Also, currently the JWT tokens simply have an "expiration date" which would not be the most optimal for many users. To accomodate to many users, especially ones frequently coming and going I would implement a way to refresh the token. Rate limiting would be a relatively simple solve as I would simply implement a mechanism that either tracks the total queries a user makes over a determined time period, or to accomodate to the monetary aspect of queries, tracks the anticipated money associated with each query. 

My logging system right now is purely limited to the simple system that flask has in place. This give basic error messaging like when the backend is connected or not but if there was an increase in users of the site, I would implement a much more structured system that provided key details on each user action (username, time, action, response). In addition to more articulate logging I would also make sure to add metrics that tell us how efficiently the system is operating as a whole (percentage of requests that are going through, cost per request, etc)

How to run the site:
- In a terminal, after being inside the AI-Tigers-Technical folder run "python backend.py"
- In a different terminal then run "npm run dev" and click the local link that will be outputted

End information:
- API Key -> In the .env file, labeled GEMINI_API_KEY, used for gemini
- JWT Key -> Backend.py file, used for tokening

User name: example@helloconstellation.com
Password: ConstellationInterview123!