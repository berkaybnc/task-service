import { Router } from "express";
import { z } from "zod";
import { MongoTaskRepository } from "../../infrastructure/persistence/MongoTaskRepository.js";
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
const repo = new MongoTaskRepository();

const ALL_TASKS_CACHE_KEY = "all_tasks";

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

taskRoutes.post("/", auth, async (req, res) => {
  const body = createSchema.parse(req.body);
  try {
    const created = await repo.create(body);
    
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
taskRoutes.get("/", auth, async (req, res) => {
  try {
    // Users can see all tasks, filtering will be handled by the frontend or by project/team membership in the future
    const filter = {}; 
    
    const tasks = await repo.findAll(filter);
    res.json(tasks);
  } catch (err) {
    logger.error({ err }, "Failed to fetch tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PROJECTS
taskRoutes.get("/projects", async (req, res) => {
  try {
    const projects = await repo.findAllProjects();
    res.json(projects);
  } catch (err) {
    logger.error(err, "Failed to fetch projects");
    res.status(500).json({ error: "Failed to fetch projects", details: err.message });
  }
});

taskRoutes.post("/projects", auth, async (req, res) => {
  try {
    const { title, teamId } = req.body;
    const project = await repo.createProject({ title, teamId });
    res.status(201).json(project);
  } catch (err) {
    logger.error(err, "Failed to create project");
    res.status(500).json({ error: "Failed to create project", details: err.message });
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
    
    // Send notification if assignee changed
    if (patch.assigneeId) {
      try {
        await notificationClient.post(`${env.NOTIFICATION_SERVICE_URL}/notifications`, {
          message: `Task "${updated.title}" assigned to you`,
          taskId: updated.id,
          taskTitle: updated.title,
          assignedTo: patch.assigneeId,
          updatedBy: req.user?.username || "unknown",
        });
      } catch (err) {
        logger.warn({ err: err.message }, "Notification failed for assignment");
      }
    }

    // Invalidate Cache
    await cache.del(ALL_TASKS_CACHE_KEY);

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: err.errors });
    }
    logger.error({ err }, "Failed to update task");
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