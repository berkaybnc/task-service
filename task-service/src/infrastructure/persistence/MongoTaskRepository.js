import Task from "../models/Task.js";
import Project from "../models/Project.js";

export class MongoTaskRepository {
  async findAll(filter = {}) {
    return await Task.find(filter);
  }

  async findById(id) {
    return await Task.findById(id);
  }

  async create(taskData) {
    const task = new Task(taskData);
    return await task.save();
  }

  async update(id, taskData) {
    return await Task.findByIdAndUpdate(id, taskData, { new: true });
  }

  async delete(id) {
    const res = await Task.findByIdAndDelete(id);
    return !!res;
  }

  async findByProjectId(projectId) {
    return await Task.find({ projectId });
  }

  // Project Methods
  async findAllProjects() {
    return await Project.find();
  }

  async createProject(projectData) {
    const project = new Project(projectData);
    return await project.save();
  }
}
