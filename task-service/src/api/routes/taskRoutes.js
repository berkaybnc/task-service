import { Router } from "express";
import { z } from "zod";
import { PostgresTaskRepository } from "../../infrastructure/persistence/PostgresTaskRepository.js";
import { Task } from "../../domain/entities/Task.js";
import { auth } from "../middlewares/auth.js";
import axios from "axios";
import axiosRetry from "axios-retry";
import { env } from "../../config/env.js";
import { logger } from "../../infrastructure/logger/logger.js";
import { cache } from "../../infrastructure/cache.js";

const notificationClient = axios.create({ 
  timeout: 5000,
  headers: {
    'X-Internal-API-Key': env.internalApiKey
  }
});

axiosRetry(notificationClient, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    (error.response?.status >= 500 && error.response?.status < 600),
});

export const taskRoutes = Router();
const repo = new PostgresTaskRepository();

const ALL_TASKS_CACHE_KEY = "all_tasks";

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["todo", "doing", "done"]).optional(),
});

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "doing", "done"]).optional(),
});

// CREATE
taskRoutes.post("/", auth, async (req, res) => {
  const body = createSchema.parse(req.body);
  const entity = new Task({ ...body });
  
  try {
    const created = await repo.create(entity);
    
    // Invalidate Cache
    await cache.del(ALL_TASKS_CACHE_KEY);

    try {
      await notificationClient.post(`${env.NOTIFICATION_SERVICE_URL}/notifications`, {
        message: "Task created successfully",
        taskId: created.id,
        taskTitle: created.title,
        createdBy: req.user?.username || "unknown",
      });
    } catch (notificationError) {
      logger.warn(
        { err: notificationError.message },
        "notification service error after retries"
      );
    }
    res.status(201).json(created);
  } catch (err) {
    logger.error({ err }, "Failed to create task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// LIST
taskRoutes.get("/", async (req, res) => {
  try {
    // Try Cache
    const cached = await cache.get(ALL_TASKS_CACHE_KEY);
    if (cached) {
      logger.info("Serving tasks from Redis cache");
      return res.json(cached);
    }

    const tasks = await repo.findAll();
    await cache.set(ALL_TASKS_CACHE_KEY, tasks);
    res.json(tasks);
  } catch (err) {
    logger.error({ err }, "Failed to fetch tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET BY ID
taskRoutes.get("/:id", async (req, res) => {
  try {
    const task = await repo.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// UPDATE
taskRoutes.patch("/:id", auth, async (req, res) => {
  try {
    const patch = updateSchema.parse(req.body);
    const updated = await repo.update(req.params.id, patch);
    if (!updated) return res.status(404).json({ message: "Task not found" });
    
    // Invalidate Cache
    await cache.del(ALL_TASKS_CACHE_KEY);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE
taskRoutes.delete("/:id", auth, async (req, res) => {
  try {
    const ok = await repo.delete(req.params.id);
    if (!ok) return res.status(404).json({ message: "Task not found" });
    
    // Invalidate Cache
    await cache.del(ALL_TASKS_CACHE_KEY);

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});