const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { DataTypes } = require("sequelize");
require("dotenv").config();

const logger = require("./logger");
const sequelize = require("./db");
const { metricsMiddleware, metricsHandler } = require("./metrics");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware());

// Define User Model
const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: "user",
  },
});

// Sync Database & Seed Initial Users
(async () => {
  try {
    await sequelize.sync();
    logger.info("Auth Database synced");
    
    // Seed admin if not exists
    const adminCount = await User.count({ where: { username: "admin" } });
    if (adminCount === 0) {
      await User.create({
        username: "admin",
        passwordHash: bcrypt.hashSync("admin123", 10),
        role: "admin",
      });
      await User.create({
        username: "user",
        passwordHash: bcrypt.hashSync("user123", 10),
        role: "user",
      });
      logger.info("Default users seeded");
    }
  } catch (err) {
    logger.error({ err }, "Database sync failed");
  }
})();

app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url }, "request");
  next();
});

const PORT = process.env.PORT || 3001;

app.get("/metrics", (req, res, next) => {
  metricsHandler(req, res).catch(next);
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "auth-service",
    database: "connected",
  });
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const foundUser = await User.findOne({ where: { username } });
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
  } catch (err) {
    logger.error({ err }, "Login error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, "Auth Service listening");
  });
}
