import express from "express";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import YAML from "yaml";

import { taskRoutes } from "./src/api/routes/taskRoutes.js";
import { authRoutes } from "./src/api/routes/authRoutes.js";
import { logger } from "./src/infrastructure/logger/logger.js";
import { errorHandler } from "./src/api/middlewares/errorHandler.js";
import { env } from "./src/config/env.js";

const app = express();

/* ---------- MIDDLEWARES ---------- */
app.use(express.json());
app.use(pinoHttp({ logger }));

/* ---------- SWAGGER ---------- */
const openapiPath = path.resolve("src/docs/openapi.yaml");
const openapiYaml = fs.readFileSync(openapiPath, "utf8");
const openapiDoc = YAML.parse(openapiYaml);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));

/* ---------- ROUTES ---------- */
app.get("/", (req, res) => {
  res.send("Task Service is running. Try /health, /docs, /tasks");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

/* ---------- ERROR HANDLER ---------- */
app.use(errorHandler);

/* ---------- START ---------- */
app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});