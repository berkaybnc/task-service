const express = require("express");
const cors = require("cors");
const { DataTypes } = require("sequelize");
require("dotenv").config();

const logger = require("./logger");
const sequelize = require("./db");
const { metricsMiddleware, metricsHandler } = require("./metrics");

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware());

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

// Internal API Key Middleware
const internalAuth = (req, res, next) => {
  const apiKey = req.headers["x-internal-api-key"];
  if (apiKey && apiKey === INTERNAL_API_KEY) {
    return next();
  }
  logger.warn({ method: req.method, url: req.url }, "Unauthorized internal request attempt");
  return res.status(403).json({ error: "Forbidden: Internal access only" });
};

// Define Notification Model
const Notification = sequelize.define("Notification", {
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  taskId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  taskTitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

// Sync Database
(async () => {
  try {
    await sequelize.sync();
    logger.info("Notification Database synced");
  } catch (err) {
    logger.error({ err }, "Database sync failed");
  }
})();

app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url }, "request");
  next();
});

const PORT = process.env.PORT || 3003;

app.get("/metrics", (req, res, next) => {
  metricsHandler(req, res).catch(next);
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "notification-service",
    database: "connected",
  });
});

app.post("/notifications", internalAuth, async (req, res) => {
  const { message, taskId, taskTitle, createdBy } = req.body;

  try {
    const notification = await Notification.create({
      message: message || "Notification received",
      taskId: taskId || null,
      taskTitle: taskTitle || null,
      createdBy: createdBy || null,
    });

    return res.status(201).json({
      status: "Notification stored",
      notification,
    });
  } catch (err) {
    logger.error({ err }, "Failed to store notification");
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/notifications", async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      limit: 50,
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({
      count: notifications.length,
      notifications,
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch notifications");
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, "Notification Service listening");
  });
}
