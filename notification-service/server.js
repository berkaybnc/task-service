const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3003;

// In-memory notifications
const notifications = [];

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "notification-service"
  });
});

// Create notification
app.post("/notifications", (req, res) => {
  const { message, taskId, taskTitle, createdBy } = req.body;

  const notification = {
    id: notifications.length + 1,
    message: message || "Notification received",
    taskId: taskId || null,
    taskTitle: taskTitle || null,
    createdBy: createdBy || null,
    createdAt: new Date().toISOString()
  };

  notifications.push(notification);

  return res.status(201).json({
    status: "Notification stored",
    notification
  });
});

// Get all notifications
app.get("/notifications", (req, res) => {
  res.status(200).json({
    count: notifications.length,
    notifications
  });
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Notification Service running on port ${PORT}`);
  });
}