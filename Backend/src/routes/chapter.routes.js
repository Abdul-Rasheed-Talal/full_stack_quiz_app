import { Router } from "express";
import mongoose from "mongoose";
import Chapter from "../models/chapter.model.js";

const router = Router();

// ===== GET ALL CHAPTERS =====
router.get("/chapters", async (req, res, next) => {
  try {
    const allChapters = await Chapter.find().select("chapterNumber title description mcqs");
    res.json(allChapters);
  } catch (err) {
    next(err);
  }
});

// ===== GET QUIZ BY CHAPTER =====
router.get("/quiz/:chapterId", async (req, res, next) => {
  try {
    const { chapterId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ error: "Invalid chapter ID format" });
    }

    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    res.json(chapter.mcqs);
  } catch (err) {
    next(err);
  }
});

export default router;
