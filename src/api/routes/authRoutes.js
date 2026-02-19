import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env.js";

export const authRoutes = Router();

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(3),
});

// Demo login: gerçek DB yok; prototip için yeterli
authRoutes.post("/login", (req, res) => {
  const { username, password } = loginSchema.parse(req.body);

  // Basit demo kontrol
  if (!(username === "admin" && password === "admin123")) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { sub: username, role: "admin" },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});