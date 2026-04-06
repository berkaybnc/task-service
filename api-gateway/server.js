require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const axios = require("axios");

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://127.0.0.1:3001";
const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL || "http://127.0.0.1:8080";
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://127.0.0.1:3003";
const PORT = Number(process.env.PORT) || 3000;

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("Gateway received:", req.method, req.url);
  next();
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "api-gateway",
  });
});

// AUTH LOGIN - manual forward
app.post("/auth/login", async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/login`, req.body);
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ message: "Gateway auth forwarding error" });
  }
});

// TASK LIST
app.get("/tasks", async (req, res) => {
  try {
    const response = await axios.get(`${TASK_SERVICE_URL}/tasks`);
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ message: "Gateway task list forwarding error" });
  }
});

// TASK GET BY ID
app.get("/tasks/:id", async (req, res) => {
  try {
    const response = await axios.get(`${TASK_SERVICE_URL}/tasks/${req.params.id}`);
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ message: "Gateway task detail forwarding error" });
  }
});

// TASK CREATE
app.post("/tasks", async (req, res) => {
  try {
    const response = await axios.post(`${TASK_SERVICE_URL}/tasks`, req.body, {
      headers: {
        Authorization: req.headers.authorization || "",
      },
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ message: "Gateway task create forwarding error" });
  }
});

// TASK UPDATE
app.patch("/tasks/:id", async (req, res) => {
  try {
    const response = await axios.patch(
      `${TASK_SERVICE_URL}/tasks/${req.params.id}`,
      req.body,
      {
        headers: {
          Authorization: req.headers.authorization || "",
        },
      }
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ message: "Gateway task update forwarding error" });
  }
});

// TASK DELETE
app.delete("/tasks/:id", async (req, res) => {
  try {
    const response = await axios.delete(`${TASK_SERVICE_URL}/tasks/${req.params.id}`, {
      headers: {
        Authorization: req.headers.authorization || "",
      },
    });
    return res.status(response.status).send(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ message: "Gateway task delete forwarding error" });
  }
});

// NOTIFICATIONS - proxy
// NOTIFICATIONS LIST
app.get("/notifications", async (req, res) => {
  try {
    const response = await axios.get(`${NOTIFICATION_SERVICE_URL}/notifications`);
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ message: "Gateway notifications forwarding error" });
  }
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
  });
}