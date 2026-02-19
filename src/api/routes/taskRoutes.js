import { Router } from "express";
import { z } from "zod";
import { InMemoryTaskRepository } from "../../infrastructure/persistence/InMemoryTaskRepository.js";
import { Task } from "../../domain/entities/Task.js";
import { auth } from "../middlewares/auth.js";

export const taskRoutes = Router();
const repo = new InMemoryTaskRepository();

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
taskRoutes.post("/",auth, (req, res) => {
  const body = createSchema.parse(req.body);
  const entity = new Task({ ...body });
  const created = repo.create(entity);
  res.status(201).json(created);
});

// LIST
taskRoutes.get("/", (req, res) => {
  res.json(repo.findAll());
});

// GET BY ID
taskRoutes.get("/:id", (req, res) => {
  const task = repo.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
});

// UPDATE
taskRoutes.patch("/:id",auth, (req, res) => {
  const patch = updateSchema.parse(req.body);
  const updated = repo.update(req.params.id, patch);
  if (!updated) return res.status(404).json({ message: "Task not found" });
  res.json(updated);
});

// DELETE
taskRoutes.delete("/:id",auth, (req, res) => {
  const ok = repo.delete(req.params.id);
  if (!ok) return res.status(404).json({ message: "Task not found" });
  res.status(204).send();
});