require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const axiosRetry = require("axios-retry").default;
const rateLimit = require("express-rate-limit");

const logger = require("./logger");
const { metricsMiddleware, metricsHandler } = require("./metrics");

axiosRetry(axios, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    (error.response?.status >= 500 && error.response?.status < 600),
});

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://127.0.0.1:3001";
const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL || "http://127.0.0.1:8080";
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://127.0.0.1:3003";
const PORT = Number(process.env.PORT) || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "";

const app = express();
app.set("trust proxy", 1);

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, try again later" },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.path === "/health" || req.path === "/metrics" || req.path === "/auth/login",
});

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Internal-API-Key"],
}));
app.use(express.json());
app.use(metricsMiddleware());
app.use(apiLimiter);

app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url }, "request");
  next();
});

// Helper for internal requests
const internalRequest = axios.create({
  headers: {
    "X-Internal-API-Key": INTERNAL_API_KEY,
  },
});

app.get("/metrics", (req, res, next) => {
  metricsHandler(req, res).catch(next);
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "api-gateway",
  });
});

app.post("/auth/login", loginLimiter, async (req, res) => {
  try {
    const response = await internalRequest.post(`${AUTH_SERVICE_URL}/auth/login`, req.body);
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    logger.error({ err: error }, "gateway auth forwarding error");
    return res.status(500).json({ message: "Gateway auth forwarding error" });
  }
});

app.post("/ai/summarize", async (req, res) => {
  const text = req.body?.text;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ message: "Field 'text' (string) is required" });
  }

  if (!OPENAI_API_KEY) {
    const preview = text.length > 120 ? `${text.slice(0, 120)}…` : text;
    return res.json({
      summary: `[mock] Summary: ${preview}`,
      mock: true,
    });
  }

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Summarize the following text in 2-4 short sentences:\n\n${text}`,
          },
        ],
        max_tokens: 256,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      logger.error({ status: r.status, data }, "OpenAI API error");
      return res.status(502).json({ message: "OpenAI request failed", detail: data });
    }
    const summary = data.choices?.[0]?.message?.content?.trim() || "";
    return res.json({ summary, mock: false });
  } catch (err) {
    logger.error({ err }, "OpenAI call failed");
    return res.status(502).json({ message: "OpenAI call failed" });
  }
});

app.get("/tasks", async (req, res) => {
  try {
    const response = await internalRequest.get(`${TASK_SERVICE_URL}/tasks`);
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    logger.error({ err: error }, "gateway task list forwarding error");
    return res.status(500).json({ message: "Gateway task list forwarding error" });
  }
});

app.get("/tasks/:id", async (req, res) => {
  try {
    const response = await internalRequest.get(`${TASK_SERVICE_URL}/tasks/${req.params.id}`);
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    logger.error({ err: error }, "gateway task detail forwarding error");
    return res.status(500).json({ message: "Gateway task detail forwarding error" });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const response = await internalRequest.post(`${TASK_SERVICE_URL}/tasks`, req.body, {
      headers: {
        Authorization: req.headers.authorization || "",
      },
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    logger.error({ err: error }, "gateway task create forwarding error");
    return res.status(500).json({ message: "Gateway task create forwarding error" });
  }
});

app.patch("/tasks/:id", async (req, res) => {
  try {
    const response = await internalRequest.patch(
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
    logger.error({ err: error }, "gateway task update forwarding error");
    return res.status(500).json({ message: "Gateway task update forwarding error" });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    const response = await internalRequest.delete(`${TASK_SERVICE_URL}/tasks/${req.params.id}`, {
      headers: {
        Authorization: req.headers.authorization || "",
      },
    });
    return res.status(response.status).send(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    logger.error({ err: error }, "gateway task delete forwarding error");
    return res.status(500).json({ message: "Gateway task delete forwarding error" });
  }
});

app.get("/notifications", async (req, res) => {
  try {
    const response = await internalRequest.get(`${NOTIFICATION_SERVICE_URL}/notifications`);
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    logger.error({ err: error }, "gateway notifications forwarding error");
    return res.status(500).json({ message: "Gateway notifications forwarding error" });
  }
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, "API Gateway listening");
  });
}
