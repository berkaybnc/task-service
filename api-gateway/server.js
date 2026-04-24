require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const axiosRetry = require("axios-retry").default;
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");

const logger = require("./logger");
const { metricsMiddleware, metricsHandler } = require("./metrics");

axiosRetry(axios, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    (error.response?.status >= 500 && error.response?.status < 600),
});

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3001";
const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL || "http://task-service:8080";
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3003";
const PORT = Number(process.env.PORT) || 5001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "";

const app = express();
app.set("trust proxy", 1);

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, try again later" },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.path === "/health" || req.path === "/metrics" || req.path === "/api/auth/login",
});

app.use(cors({
  origin: "*",
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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const userSockets = new Map();

io.on("connection", (socket) => {
  socket.on("identify", (username) => {
    userSockets.set(username, socket.id);
    logger.info({ username, socketId: socket.id }, "User identified for WebSockets");
  });

  socket.on("disconnect", () => {
    for (const [username, id] of userSockets.entries()) {
      if (id === socket.id) {
        userSockets.delete(username);
        break;
      }
    }
  });
});

// Broadcast endpoint for internal services
app.post("/internal/broadcast", (req, res) => {
  const apiKey = req.headers["x-internal-api-key"];
  if (INTERNAL_API_KEY && apiKey !== INTERNAL_API_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { targetUser, event, data } = req.body;
  if (targetUser) {
    const socketId = userSockets.get(targetUser);
    if (socketId) {
      io.to(socketId).emit(event, data);
      logger.info({ targetUser, event }, "Direct message sent via WS");
    }
  } else {
    io.emit(event, data);
    logger.info({ event }, "Broadcast message sent via WS");
  }
  res.json({ success: true });
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

const apiRouter = express.Router();

apiRouter.post("/auth/login", loginLimiter, async (req, res) => {
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

apiRouter.post("/auth/register", async (req, res) => {
  try {
    const response = await internalRequest.post(`${AUTH_SERVICE_URL}/auth/register`, req.body);
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    logger.error({ err: error }, "gateway registration forwarding error");
    return res.status(500).json({ message: "Gateway registration forwarding error" });
  }
});

apiRouter.get("/tasks", async (req, res) => {
  try {
    const response = await internalRequest.get(`${TASK_SERVICE_URL}/tasks`, {
      headers: { Authorization: req.headers.authorization || "" }
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    logger.error({ err: error }, "gateway task list forwarding error");
    return res.status(500).json({ message: "Gateway task list forwarding error" });
  }
});

apiRouter.post("/tasks", async (req, res) => {
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

apiRouter.patch("/tasks/:id", async (req, res) => {
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

apiRouter.delete("/tasks/:id", async (req, res) => {
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

apiRouter.get("/users", async (req, res) => {
  try {
    const response = await internalRequest.get(`${AUTH_SERVICE_URL}/users`, {
      headers: { Authorization: req.headers.authorization || "" }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

apiRouter.get("/teams", async (req, res) => {
  try {
    const response = await internalRequest.get(`${AUTH_SERVICE_URL}/teams`, {
      headers: { Authorization: req.headers.authorization || "" }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teams" });
  }
});

apiRouter.post("/teams", async (req, res) => {
  try {
    const response = await internalRequest.post(`${AUTH_SERVICE_URL}/teams`, req.body, {
      headers: { Authorization: req.headers.authorization || "" }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Error creating team" });
  }
});

apiRouter.post("/teams/:id/members", async (req, res) => {
  try {
    const response = await internalRequest.post(`${AUTH_SERVICE_URL}/teams/${req.params.id}/members`, req.body, {
      headers: { Authorization: req.headers.authorization || "" }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Error adding team member" });
  }
});

apiRouter.get("/projects", async (req, res) => {
  try {
    const response = await internalRequest.get(`${TASK_SERVICE_URL}/tasks/projects`, {
      headers: { Authorization: req.headers.authorization || "" }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ message: "Error fetching projects" });
  }
});

apiRouter.post("/projects", async (req, res) => {
  try {
    const response = await internalRequest.post(`${TASK_SERVICE_URL}/tasks/projects`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ message: "Error creating project" });
  }
});

apiRouter.get("/notifications", async (req, res) => {
  try {
    const { recipient } = req.query;
    const response = await internalRequest.get(`${NOTIFICATION_SERVICE_URL}/notifications`, {
      params: { recipient }
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    logger.error({ err: error }, "gateway notifications forwarding error");
    return res.status(500).json({ message: "Gateway notifications forwarding error" });
  }
});

apiRouter.post("/tasks/:id/comments", async (req, res) => {
  try {
    const response = await internalRequest.post(`${TASK_SERVICE_URL}/tasks/${req.params.id}/comments`, req.body, {
      headers: { Authorization: req.headers.authorization || "" }
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ message: "Gateway comment create error" });
  }
});

apiRouter.get("/tasks/:id/comments", async (req, res) => {
  try {
    const response = await internalRequest.get(`${TASK_SERVICE_URL}/tasks/${req.params.id}/comments`, {
      headers: { Authorization: req.headers.authorization || "" }
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ message: "Gateway comment fetch error" });
  }
});

// ─── ATTACHMENTS ────────────────────────────────────────────

// LIST ekleri
apiRouter.get("/tasks/:id/attachments", async (req, res) => {
  try {
    const response = await internalRequest.get(
      `${TASK_SERVICE_URL}/tasks/${req.params.id}/attachments`,
      { headers: { Authorization: req.headers.authorization || "" } }
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) return res.status(error.response.status).json(error.response.data);
    logger.error({ err: error }, "gateway attachment list error");
    return res.status(500).json({ message: "Gateway attachment list error" });
  }
});

// UPLOAD — multipart/form-data stream'i olduğu gibi task-service'e ilet
apiRouter.post("/tasks/:id/attachments", express.raw({ type: "*/*", limit: "12mb" }), async (req, res) => {
  try {
    const response = await internalRequest.post(
      `${TASK_SERVICE_URL}/tasks/${req.params.id}/attachments`,
      req.body,
      {
        headers: {
          Authorization:  req.headers.authorization || "",
          "Content-Type": req.headers["content-type"] || "multipart/form-data",
        },
        responseType: "json",
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) return res.status(error.response.status).json(error.response.data);
    logger.error({ err: error }, "gateway attachment upload error");
    return res.status(500).json({ message: "Gateway attachment upload error" });
  }
});

// DOWNLOAD — binary stream
apiRouter.get("/tasks/:id/attachments/:attachmentId", async (req, res) => {
  try {
    const response = await internalRequest.get(
      `${TASK_SERVICE_URL}/tasks/${req.params.id}/attachments/${req.params.attachmentId}`,
      {
        headers: { Authorization: req.headers.authorization || "" },
        responseType: "arraybuffer",
      }
    );
    res.set("Content-Type",        response.headers["content-type"]);
    res.set("Content-Disposition", response.headers["content-disposition"]);
    res.set("Content-Length",      response.headers["content-length"]);
    return res.status(response.status).send(response.data);
  } catch (error) {
    if (error.response) return res.status(error.response.status).json(error.response.data);
    logger.error({ err: error }, "gateway attachment download error");
    return res.status(500).json({ message: "Gateway attachment download error" });
  }
});

// DELETE ek
apiRouter.delete("/tasks/:id/attachments/:attachmentId", async (req, res) => {
  try {
    const response = await internalRequest.delete(
      `${TASK_SERVICE_URL}/tasks/${req.params.id}/attachments/${req.params.attachmentId}`,
      { headers: { Authorization: req.headers.authorization || "" } }
    );
    return res.status(response.status).send(response.data);
  } catch (error) {
    if (error.response) return res.status(error.response.status).json(error.response.data);
    logger.error({ err: error }, "gateway attachment delete error");
    return res.status(500).json({ message: "Gateway attachment delete error" });
  }
});




app.use("/api", apiRouter);

if (require.main === module) {
  server.listen(PORT, () => {
    logger.info({ port: PORT }, "API Gateway listening with WebSockets");
  });
}

module.exports = app;
