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
    const recom: iPostRecommendation = req.body
    const dbres = await client.query('insert into recommendations(user_id,author,url,title,description,tags,content_type,rating,reason,build_week) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *', [recom.user_id, recom.author, recom.url, recom.title, recom.description, recom.tags, recom.content_type, recom.rating, recom.reason, recom.build_week]);
    res.json(dbres.rows);
  } catch (error) {
    res.json(error.detail)
    console.error(error.detail)
  }
});

app.get("/likes/:id", async (req, res) => {
  res.set('access-control-allow-origin', '*')
  const userID= parseInt(req.params.id)
  console.log(userID)
  try {
    const query = "select post_id, SUM(likes) as likes from likes where user_id=$1 group by post_id"
    

    const dbres= await client.query(query,[userID])

    res.json(dbres.rows)

  }
  catch (error) {
    res.status(404).send("can't get the likes from database")
    console.error(error)
  }
})


//
app.get("/search/:selector/:searchItem", async (req, res) => {
  // res.set('access-control-allow-origin', '*')
  try {
    const selector = req.params.selector
    const searchItem = req.params.searchItem
    let queryString: string;
    if (selector === "tags") {
      queryString = `select * from recommendations where $1=ANY(tags)`
      const dbres = await client.query(queryString, [searchItem])
      res.json(dbres.rows)

    }

    else if (selector === 'All') {
      queryString = "select * from recommendations where lower(author) like lower($1) or lower(title) like lower($2) order by date desc"
      const wildcardSearch = "%" + searchItem + "%"
      const dbres = await client.query(queryString, [wildcardSearch, wildcardSearch])

      res.json(dbres.rows)

    }

    else {
      queryString = `select * from recommendations where lower(${selector}) like lower($1) order by date desc`;
      const wildcardSearch = "%" + searchItem + "%"
      const dbres = await client.query(queryString, [wildcardSearch])
      res.json(dbres.rows)
    }

  } catch (error) {
    res.status(404).send("can't get from database")
    console.error(error)
  }
});

// get list of users
app.get("/users", async (req, res) => {
  res.set('access-control-allow-origin', '*')
  try {
    const dbres = await client.query("select * from users order by name")
    res.json(dbres.rows)
  }
  catch (error) {
    res.status(404).send("can't get from database")
    console.error(error)
  }
})

// get user's saved recommendations
app.get("/users/saved/:id", async (req, res) => {
  res.set('access-control-allow-origin', '*')
  try {
    const id = parseInt(req.params.id)
    const dbres = await client.query("WITH saved_array AS(select saved_recommendations from users where user_id = $1)select * from recommendations where id=any(SELECT unnest(saved_recommendations) FROM saved_array)", [id])
    res.json(dbres.rows)


  }
  catch (error) {
    res.status(404).send("can't get from database")
    console.error(error)
  }
})
//add a saved recommendation 
app.patch("/users/addsaved/:id/:savedrec", async (req, res) => {
  res.set('access-control-allow-origin', '*')
  try {
    const id = parseInt(req.params.id)
    const savedrec = parseInt(req.params.savedrec)
    const dbres = await client.query('update users set saved_recommendations = array_append(saved_recommendations, $1) where user_id = $2 returning *', [savedrec, id]);
    res.json(dbres.rows)
  } catch (error) {
    res.status(404).send("can't update database")
    console.error(error)
  }
});

//remove a saved recommendation

app.patch("/users/removesaved/:id/:savedrec", async (req, res) => {
  res.set('access-control-allow-origin', '*')
  try {
    const id = parseInt(req.params.id)
    const savedrec = parseInt(req.params.savedrec)
    const dbres = await client.query('update users set saved_recommendations = array_remove(saved_recommendations, $1) where user_id = $2 returning *', [savedrec, id]);
    res.json(dbres.rows)
  } catch (error) {
    res.status(404).send("can't update database")
    console.error(error)
  }
});

// get comments
app.get("/comments/:postid", async (req, res) => {
  res.set('access-control-allow-origin', '*')
  try {
    const postid = parseInt(req.params.postid)
    const query = "select users.name, comments.comment, comments.comment_id from comments join users on users.user_id = comments.user_id where comments.post_id=$1"
    const dbres = await client.query(query, [postid])
    res.json(dbres.rows)
  }
  catch (error) {
    res.status(404).send("can't get from database")
    console.error(error)
  }
})

// post comment 
app.post("/comments", async (req, res) => {
  res.set('access-control-allow-origin', '*')
  try {
    const { userid, postid, comment } = req.body
    const query = "insert into comments (user_id, post_id, comment) values ($1, $2, $3) returning *"
    const dbres = await client.query(query, [userid, postid, comment])
    res.json(dbres.rows);
  } catch (error) {
    res.status(400).send("can't post to database")
    console.error(error)
  }
});

// delete comment
app.delete("/comments/:commentid", async (req, res) => {
  res.set('access-control-allow-origin', '*')
  try {
    const commentid = req.params.commentid
    const query = "delete from comments * where comment_id =$1 returning *"
    const dbres = await client.query(query, [commentid])
    res.json(dbres.rows)

  }
  catch (error) {
    res.status(400).send("can't delete from database")
    console.error(error)
  }
})


// get likes 
app.get("/likes", async (req, res) => {
  res.set('access-control-allow-origin', '*')
  try {
    const queryLikes = "select post_id, sum(likes) as total_likes from likes where likes = 1 group by post_id"
    const queryDislikes = "select post_id, sum(likes) as total_dislikes from likes where likes = -1 group by post_id"

    const dbresLikes = await client.query(queryLikes)
    const dbresDislikes = await client.query(queryDislikes)

    const result = { likes: dbresLikes.rows, dislikes: dbresDislikes.rows }
    res.json(result)

  }
  catch (error) {
    res.status(404).send("can't get from database")
    console.error(error)
  }
})

// post likes to db
app.post("/likes", async (req, res) => {
  res.set('access-control-allow-origin', '*')
  try {
    const { userid, postid, likes } = req.body
    const query = "insert into likes(user_id, post_id, likes) values ($1, $2, $3)"
    const dbres = await client.query(query, [userid, postid, likes])
    res.json(dbres.rows);
  } catch (error) {
    res.status(400).send("can't post to database")
    console.error(error)
  }
});
//this will return us an array of {post_id:number, likes:number}

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
