import { Router } from "express";
import { z } from "zod";
import { MongoTaskRepository } from "../../infrastructure/persistence/MongoTaskRepository.js";
import { MongoCommentRepository } from "../../infrastructure/persistence/MongoCommentRepository.js";
import { MongoAttachmentRepository } from "../../infrastructure/persistence/MongoAttachmentRepository.js";
import { auth } from "../middlewares/auth.js";
import axios from "axios";
import axiosRetry from "axios-retry";
import multer from "multer";
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
const commentRepo = new MongoCommentRepository();
const attachmentRepo = new MongoAttachmentRepository();

// Multer: dosyaları bellekte tut → MongoDB Buffer'a yaz
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ALLOWED = [
      "image/", "application/pdf",
      "text/", "application/json",
      "application/zip", "application/x-zip-compressed",
      "application/msword",
      "application/vnd.openxmlformats-officedocument",
      "application/vnd.ms-excel",
      "application/vnd.ms-powerpoint",
    ];
    const ok = ALLOWED.some((prefix) => file.mimetype.startsWith(prefix));
    cb(ok ? null : new Error("Desteklenmeyen dosya türü"), ok);
  },
});

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

const commentCreateSchema = z.object({
  text: z.string().min(1),
  authorName: z.string().optional(),
});

taskRoutes.post("/", auth, async (req, res) => {
  const body = createSchema.parse(req.body);
  try {
    const created = await repo.create({ ...body, ownerId: req.user.username });
    
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
    // Filter tasks by ownerId OR assigneeId
    const filter = { 
      $or: [
        { ownerId: req.user.username },
        { assigneeId: req.user.username }
      ]
    }; 
    
    const tasks = await repo.findAll(filter);
    res.json(tasks);
  } catch (err) {
    logger.error({ err }, "Failed to fetch tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PROJECTS
taskRoutes.get("/projects", auth, async (req, res) => {
  try {
    const projects = await repo.findAllProjects({ ownerId: req.user.username });
    res.json(projects);
  } catch (err) {
    logger.error(err, "Failed to fetch projects");
    res.status(500).json({ error: "Failed to fetch projects", details: err.message });
  }
});

taskRoutes.post("/projects", auth, async (req, res) => {
  try {
    const { title, teamId } = req.body;
    const project = await repo.createProject({ title, teamId, ownerId: req.user.username });
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

// COMMENTS
taskRoutes.post("/:id/comments", auth, async (req, res) => {
  try {
    const body = commentCreateSchema.parse(req.body);
    const task = await repo.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const comment = await commentRepo.create({
      ...body,
      taskId: req.params.id,
      authorId: req.user.username,
      authorName: req.user.displayName || req.user.username
    });

    // Notify task owner if someone else comments
    if (task.ownerId !== req.user.username) {
      try {
        // Persistent notification
        await notificationClient.post(`${env.NOTIFICATION_SERVICE_URL}/notifications`, {
          message: `${req.user.username} commented on your task: ${task.title}`,
          taskId: task.id,
          taskTitle: task.title,
          recipient: task.ownerId,
          commentText: body.text
        });

        // Live broadcast via API Gateway
        await notificationClient.post(`${env.API_GATEWAY_URL}/internal/broadcast`, {
          targetUser: task.ownerId,
          event: "notification",
          data: {
            message: `${req.user.username} commented on your task: ${task.title}`,
            type: "comment",
            taskId: task.id
          }
        });
      } catch (err) {
        logger.warn({ err: err.message }, "Comment notification or broadcast failed");
      }
    }

    res.status(201).json(comment);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: err.errors });
    }
    logger.error({ err }, "Failed to add comment");
    res.status(500).json({ error: "Internal server error" });
  }
});

taskRoutes.get("/:id/comments", async (req, res) => {
  try {
    const comments = await commentRepo.findByTaskId(req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── ATTACHMENTS ────────────────────────────────────────────

// LIST: Göreve ait dosyaların meta bilgisi (binary hariç)
taskRoutes.get("/:id/attachments", auth, async (req, res) => {
  try {
    const task = await repo.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const attachments = await attachmentRepo.findByTaskId(req.params.id);
    res.json(attachments);
  } catch (err) {
    logger.error({ err }, "Failed to list attachments");
    res.status(500).json({ error: "Internal server error" });
  }
});

// UPLOAD: Tek dosya yükle
taskRoutes.post(
  "/:id/attachments",
  auth,
  upload.single("file"),
  async (req, res) => {
    try {
      const task = await repo.findById(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      if (!req.file) return res.status(400).json({ error: "Dosya bulunamadı" });

      const saved = await attachmentRepo.create({
        taskId:     req.params.id,
        uploadedBy: req.user.username,
        filename:   req.file.originalname,
        mimetype:   req.file.mimetype,
        size:       req.file.size,
        data:       req.file.buffer,
      });

      // data Buffer'ı yanıtta döndürme
      const { data: _data, ...meta } = saved.toObject();
      res.status(201).json(meta);
    } catch (err) {
      if (err.message === "Desteklenmeyen dosya türü") {
        return res.status(415).json({ error: err.message });
      }
      logger.error({ err }, "Failed to upload attachment");
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DOWNLOAD: Dosyayı binary olarak indir
taskRoutes.get("/:id/attachments/:attachmentId", auth, async (req, res) => {
  try {
    const attachment = await attachmentRepo.findById(req.params.attachmentId);
    if (!attachment) return res.status(404).json({ message: "Attachment not found" });

    res.set("Content-Type", attachment.mimetype);
    res.set("Content-Disposition", `attachment; filename="${encodeURIComponent(attachment.filename)}"`);
    res.set("Content-Length", attachment.size);
    res.send(attachment.data);
  } catch (err) {
    logger.error({ err }, "Failed to download attachment");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE: Eki sil
taskRoutes.delete("/:id/attachments/:attachmentId", auth, async (req, res) => {
  try {
    const ok = await attachmentRepo.delete(req.params.attachmentId);
    if (!ok) return res.status(404).json({ message: "Attachment not found" });
    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Failed to delete attachment");
    res.status(500).json({ error: "Internal server error" });
  }
});
