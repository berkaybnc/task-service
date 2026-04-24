import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, default: "todo" },
  priority: { type: String, default: "medium" },
  assigneeId: String,
  projectId: String,
  dueDate: Date,
  tags: [String]
}, { timestamps: true });

const Task = mongoose.model("Task", TaskSchema);

export default Task;
