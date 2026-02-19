import crypto from "crypto";

export class InMemoryTaskRepository {
  constructor() {
    this.tasks = new Map();
  }

  create(data) {
    const id = crypto.randomUUID();
    const task = { ...data, id };
    this.tasks.set(id, task);
    return task;
  }

  findAll() {
    return Array.from(this.tasks.values());
  }

  findById(id) {
    return this.tasks.get(id) || null;
  }

  update(id, patch) {
    const current = this.findById(id);
    if (!current) return null;
    const updated = { ...current, ...patch };
    this.tasks.set(id, updated);
    return updated;
  }

  delete(id) {
    return this.tasks.delete(id);
  }
}