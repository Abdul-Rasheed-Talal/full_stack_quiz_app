import { Router } from "express";
import mongoose from "mongoose";
import Chapter from "../models/chapter.model.js";
import TestResult from "../models/testResult.model.js";

const router = Router();

// ===== SUBMIT TEST (Server-Side Scoring) =====
router.post("/submit-test", async (req, res, next) => {
  try {
    const { user, chapter, answers } = req.body;

    // Input validation
    if (!user || !chapter || !answers) {
      return res.status(400).json({ error: "user, chapter, and answers are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(user) || !mongoose.Types.ObjectId.isValid(chapter)) {
      return res.status(400).json({ error: "Invalid user or chapter ID" });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: "answers must be an array" });
    }

    // Fetch the chapter to get correct answers
    const chapterDoc = await Chapter.findById(chapter);
    if (!chapterDoc) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    const totalQuestions = chapterDoc.mcqs.length;
    const attempted = answers.length;
    let correct = 0;

    // Server-side scoring — compare answers against DB
    answers.forEach((ans) => {
      const mcq = chapterDoc.mcqs.find(
        (q) => q._id.toString() === ans.questionId
      );
      if (mcq && mcq.correctOption === ans.selectedOption) {
        correct++;
      }
    });

    const wrong = attempted - correct;
    const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

    const result = await TestResult.create({
      user,
      chapter,
      totalQuestions,
      attempted,
      correct,
      wrong,
      score,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
