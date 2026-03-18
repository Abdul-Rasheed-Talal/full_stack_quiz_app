import mongoose from "mongoose";
import "dotenv/config";
import fs from "fs"
import { DB_NAME } from "./src/constants.js"
import Chapter from "./src/models/chapter.model.js"


// connect DB

const connectDB = async ()=>{
     try {
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log(`MongoDB connected !! DB Host :${connectionInstance.connection.host}`)    
    } catch (error) {
        console.log("MongoDB Connection ERROR!", error);
        process.exit(1);
    }
}
connectDB();

// read JSON file
const data = JSON.parse(
  fs.readFileSync("./src/data/chapters.json", "utf-8")
)

const seedData = async () => {
  try {
    await Chapter.deleteMany()

    // insert new data
    await Chapter.insertMany(data)

    console.log("Data inserted successfully")
    process.exit()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

seedData()