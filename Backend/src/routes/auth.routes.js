import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

const router = Router();

// ===== SIGNUP =====
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Duplicate check
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      message: "Signup successful",
      _id: user._id,
      name: user.name,
    });
  } catch (err) {
    next(err);
  }
});

// ===== LOGIN =====
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({
      message: "Login success",
      _id: user._id,
      name: user.name,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
