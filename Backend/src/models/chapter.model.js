import mongoose from "mongoose";
const mcqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      validate: {
        validator: (v) => v.length === 4,
        message: "Each MCQ must have exactly 4 options",
      },
    },
    correctOption: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
  },
  { _id: true }
);

const chapterSchema = new mongoose.Schema({
  chapterNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  mcqs: [mcqSchema],
});

const Chapter = mongoose.model("Chapter" , chapterSchema)
export default Chapter