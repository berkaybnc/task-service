import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  const token = header.substring("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload; // { sub, role }
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    return res.status(401).json({ message: "Invalid or expired token", details: err.message });
  }
}