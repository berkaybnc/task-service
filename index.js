import express from "express";
import pinoHttp from "pino-http";
import { taskRoutes } from "./src/api/routes/taskRoutes.js";
import { authRoutes } from "./src/api/routes/authRoutes.js";
import { logger } from "./src/infrastructure/logger/logger.js";
import { errorHandler } from "./src/api/middlewares/errorHandler.js";
import { env } from "./src/config/env.js";

const app = express();

app.use(express.json());
app.use(pinoHttp({ logger }));

app.get("/", (req, res) => {
  res.send("Task Service is running. Try /health, /auth/login and /tasks");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Task Service running on http://localhost:${env.PORT}`);
});