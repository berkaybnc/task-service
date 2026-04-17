const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const logger = require("./logger");
const { metricsMiddleware, metricsHandler } = require("./metrics");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware());

app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url }, "request");
  next();
});

const PORT = process.env.PORT || 3001;

const users = [
  { username: "admin", passwordHash: bcrypt.hashSync("admin123", 10), role: "admin" },
  { username: "user", passwordHash: bcrypt.hashSync("user123", 10), role: "user" },
];

app.get("/metrics", (req, res, next) => {
  metricsHandler(req, res).catch(next);
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "auth-service",
  });
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  const foundUser = users.find((u) => u.username === username);
  const ok =
    foundUser && password && (await bcrypt.compare(password, foundUser.passwordHash));

  if (!ok) {
    return res.status(401).json({
      error: "Invalid username or password",
    });
  }

  const token = jwt.sign(
    {
      username: foundUser.username,
      role: foundUser.role,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return res.status(200).json({
    message: "Login successful",
    token,
    user: {
      username: foundUser.username,
      role: foundUser.role,
    },
  });
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, "Auth Service listening");
  });
}
