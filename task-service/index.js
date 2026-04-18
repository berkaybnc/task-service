import express from "express";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import YAML from "yaml";

import { taskRoutes } from "./src/api/routes/taskRoutes.js";

import { logger } from "./src/infrastructure/logger/logger.js";
import { errorHandler } from "./src/api/middlewares/errorHandler.js";
import { env } from "./src/config/env.js";
import { metricsMiddleware, metricsHandler } from "./src/infrastructure/metrics.js";
import sequelize from "./src/infrastructure/database.js";

const app = express();

/* ---------- MIDDLEWARES ---------- */
app.use(express.json());
app.use(metricsMiddleware());
app.use(pinoHttp({ logger }));

/* ---------- SWAGGER ---------- */
const openapiPath = path.resolve("src/docs/openapi.yaml");
const openapiYaml = fs.readFileSync(openapiPath, "utf8");
const openapiDoc = YAML.parse(openapiYaml);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));

/* ---------- ROUTES ---------- */
app.get("/metrics", (req, res, next) => {
  metricsHandler(req, res).catch(next);
});

app.get("/", (req, res) => {
  res.send("Task Service is running. Try /health, /docs, /tasks");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "task-service",
    database: "connected",
    time: new Date().toISOString(),
  });
});

app.use("/tasks", taskRoutes);

/* ---------- ERROR HANDLER ---------- */
app.use(errorHandler);

/* ---------- START ---------- */
export { app };

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  (async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync();
      logger.info("Database connected and synced");
    } catch (err) {
      logger.error({ err }, "Database connection failed");
    }
    
    app.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, "Task Service listening");
    });
  })();
}