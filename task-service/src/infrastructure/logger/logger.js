import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: { service: "task-service" },
  redact: ["req.headers.authorization"],
});