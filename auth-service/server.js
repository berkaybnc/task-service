const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Demo users
const users = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "user", password: "user123", role: "user" }
];

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "auth-service"
  });
});

// Login
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;

  const foundUser = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!foundUser) {
    return res.status(401).json({
      error: "Invalid username or password"
    });
  }

  const token = jwt.sign(
    {
      username: foundUser.username,
      role: foundUser.role
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return res.status(200).json({
    message: "Login successful",
    token,
    user: {
      username: foundUser.username,
      role: foundUser.role
    }
  });
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
  });
}