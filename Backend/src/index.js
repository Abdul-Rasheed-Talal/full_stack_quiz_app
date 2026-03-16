import express from "express";
import "dotenv/config";
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/db.js";

connectDB();
const app = express();
const port = process.env.port;

// app.get('/' , (req , res)=>{
//     res.send('server running')
// });

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
