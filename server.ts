import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
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
app.get("/all", async (req, res) => {
  try {
  const dbres = await client.query('select * from recommendations order by date desc');
  res.json(dbres.rows);
  } catch (error) {
    console.error(error)
  }
});

//to get ALL recent posts that include the search term
app.get("/all/:search", async (req, res) => {
  try {
  const search = req.params.search
  const dbres = await client.query('select * from recommendations where author like $1 or title like $1 order by date desc', [search]);
  res.json(dbres.rows);
  } catch (error) {
    console.error(error)
  }
});


//to get the 10 most recent posts
app.get("/recent", async (req, res) => {
  try {
  const dbres = await client.query('select * from recommendations order by date desc limit 10');
  res.json(dbres.rows);
  } catch (error) {
    console.error(error)
  }
});

//post a new recommendation
app.post("/", async (req, res) => {
  try {
  const recom:iPostRecommendation = req.body
  const dbres = await client.query('insert into recommendations(author,url,title,description,tags,content_type,rating,reason,build_week) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *',[recom.author,recom.url,recom.title,recom.description,recom.tags,recom.content_type,recom.rating,recom.reason,recom.build_week]);
  res.json(dbres.rows);
  } catch (error) {
    console.error(error)
  }
});

//
app.get("/:filterVariable/:filterItem", async (req, res) => {
  try {
  const conditionVariable = req.params.filterVariable
  const filterCondition = req.params.filterItem
  console.log({conditionVariable,filterCondition})
  let queryString:string;
  if (conditionVariable === 'tags') {
  queryString = `select * from recommendations where '${filterCondition}'=ANY(${conditionVariable})`
  }else {
    queryString = `select * from recommendations where ${conditionVariable}='${filterCondition}'`
  }
  
  console.log(queryString)
  const dbres = await client.query(queryString);
  res.json(dbres.rows);
  } catch (error) {
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
