export class Task {
  constructor({ id, title, description = "", status = "todo", createdAt }) {
    if (!title || title.trim().length < 2) {
      throw new Error("Title is required (min 2 chars)");
    }
    this.id = id;
    this.title = title.trim();
    this.description = description;
    this.status = status; // todo | doing | done
    this.createdAt = createdAt || new Date().toISOString();
  }
}