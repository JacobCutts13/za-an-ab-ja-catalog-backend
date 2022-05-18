import { Client } from "pg";
import { config } from "dotenv";
import express, { query } from "express";
import cors from "cors";
import iPostRecommendation from './reqInterface'

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

//to get ALL recent posts
app.get("/All", async (req, res) => {
  res.set('access-control-allow-origin', '*')
  try {
  const dbres = await client.query('select * from recommendations order by date desc');
  res.json(dbres.rows);
  } catch (error) {
    res.status(404)
    console.error(error)
  }
});

//to get ALL recent posts that include the search term
// app.get("/All/:search", async (req, res) => {
//   res.set('access-control-allow-origin', '*')
//   try {
//   const search = req.params.search
//   const dbres = await client.query('select * from recommendations where author like $1 or title like $1 order by date desc', [search]);
//   res.json(dbres.rows);
//   } catch (error) {
//     res.status(404)
//     console.error(error)
//   }
// });


//to get the 10 most recent posts
app.get("/recent", async (req, res) => {
  res.set('access-control-allow-origin', '*')
  try {
  const dbres = await client.query('select * from recommendations order by date desc limit 10');
  res.json(dbres.rows);
  } catch (error) {
    res.status(404)
    console.error(error)
  }
});

//post a new recommendation
app.post("/", async (req, res) => {
  res.set('access-control-allow-origin', '*')
  try {
  const recom:iPostRecommendation = req.body
  const dbres = await client.query('insert into recommendations(user_id,author,url,title,description,tags,content_type,rating,reason,build_week) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *',[recom.user_id, recom.author,recom.url,recom.title,recom.description,recom.tags,recom.content_type,recom.rating,recom.reason,recom.build_week]);
  res.json(dbres.rows);
  } catch (error) {
    res.status(404).send("can't get from database")
    console.error(error)
  }
});

//
app.get("/:selector/:searchItem", async (req, res) => {
 // res.set('access-control-allow-origin', '*')
  try {
  const selector = req.params.selector
  const searchItem = req.params.searchItem
  let queryString:string;
  if (selector === "tags") {
  queryString = `select * from recommendations where $1=ANY(tags)`
  const dbres = await client.query(queryString, [searchItem])
  res.json(dbres.rows)
  
  }
  
  else if (selector === 'All'){
    queryString = "select * from recommendations where lower(author) like lower($1) or lower(title) like lower($2) order by date desc"
    const wildcardSearch = "%"+searchItem+"%"
    const dbres = await client.query(queryString, [wildcardSearch, wildcardSearch])
    
    res.json(dbres.rows)

  }
  
  else{
    queryString = `select * from recommendations where lower(${selector}) like lower($1) order by date desc`;
    const wildcardSearch = "%"+searchItem+"%"
    const dbres = await client.query(queryString, [wildcardSearch])
    res.json(dbres.rows)
  }

  }catch (error) {
    res.status(404).send("can't get from database")
    console.error(error)
  }
});

// get list of users
app.get("/users", async (req, res) => {
  res.set('access-control-allow-origin', '*')
try{
  const dbres = await client.query("select name, is_faculty, user_id from users order by name")
  res.json(dbres.rows)
}
catch(error){
  res.status(404).send("can't get from database")
  console.error(error)
}
})

// get user's saved recommendations
app.get("/users/saved/:id", async (req, res) => {
  res.set('access-control-allow-origin', '*')
try{
  const id = parseInt(req.params.id)
  const dbres = await client.query("WITH saved_array AS(select saved_recommendations from users where user_id = $1)select * from recommendations where id=any(SELECT unnest(saved_recommendations) FROM saved_array)", [id])
  res.json(dbres.rows)
  

}
catch(error){
  res.status(404).send("can't get from database")
  console.error(error)
}
})

app.put("/users/saved/:id/:savedrec", async (req, res) => {
  res.set('access-control-allow-origin', '*')
  try {
  const id = parseInt(req.params.id)
  const savedrec = parseInt(req.params.savedrec)
  const dbres = await client.query('update users set saved_recommendations = array_append(saved_recommendations, $1) where user_id = $2 returning *', [savedrec, id]);
  ;
  res.json(dbres.rows)
  } catch (error) {
    res.status(404).send("can't update database")
    console.error(error)
  }
});


//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
