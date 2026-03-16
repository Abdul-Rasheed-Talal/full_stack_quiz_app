import express from "express";
import "dotenv/config";
import connectDB from "./db/db.js";

import Chapters from "./models/chapter.model.js"
import User from "./models/user.model.js"
import TestResult from "./models/testResult.model.js"
const app = express();       

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
connectDB();
const port = process.env.port;


app.get('/' , (_, res)=>{
    res.send('server running')
});


// chapter api
app.get("/chapters", async (req, res) => {

  const allChapters = await Chapters.find()

  res.json(allChapters)

})
app.get("/quiz/:chapterId", async (req, res) => {

  const chapter = await Chapters.findById(req.params.chapterId)

  res.json(chapter.mcqs)

})
// signup route
app.post("/signup", async (req, res) => {

  const { name, email, password } = req.body

  const user = await User.create({
    name,
    email,
    password
  })

  res.json(user)

})

//login testing
app.post("/login", async (req, res) => {

  const { email, password } = req.body

  const user = await User.findOne({ email, password })

  if(!user){
    return res.send("Invalid credentials")
  }

  res.send("Login success")

})
// submit result
app.post("/submit-test", async (req, res) => {

  const { user, chapter, totalQuestions, attempted, correct, wrong, score } = req.body

  const result = await TestResult.create({
    user,
    chapter,
    totalQuestions,
    attempted,
    correct,
    wrong,
    score
  })

  res.json(result)

})
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
