const express = require("express");
const cors = require("cors");
require("dotenv").config();

const logger = require("./logger");
const { metricsMiddleware, metricsHandler } = require("./metrics");

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware());

app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url }, "request");
  next();
});

const PORT = process.env.PORT || 3003;

const notifications = [];

app.get("/metrics", (req, res, next) => {
  metricsHandler(req, res).catch(next);
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "notification-service",
  });
});

app.post("/notifications", (req, res) => {
  const { message, taskId, taskTitle, createdBy } = req.body;

  const notification = {
    id: notifications.length + 1,
    message: message || "Notification received",
    taskId: taskId || null,
    taskTitle: taskTitle || null,
    createdBy: createdBy || null,
    createdAt: new Date().toISOString(),
  };

  notifications.push(notification);

  return res.status(201).json({
    status: "Notification stored",
    notification,
  });
});

app.get("/notifications", (req, res) => {
  res.status(200).json({
    count: notifications.length,
    notifications,
  });
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, "Notification Service listening");
  });
}
