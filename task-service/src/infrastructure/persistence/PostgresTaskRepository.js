import { DataTypes } from "sequelize";
import sequelize from "../database.js";

const TaskModel = sequelize.define("Task", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "todo",
  },
});

export class PostgresTaskRepository {
  constructor() {
    this.model = TaskModel;
    // Sync table in constructor for simplicity in this project
    this.model.sync();
  }

  async create(data) {
    const task = await this.model.create(data);
    return task.toJSON();
  }

  async findAll() {
    const tasks = await this.model.findAll();
    return tasks.map(t => t.toJSON());
  }

  async findById(id) {
    const task = await this.model.findByPk(id);
    return task ? task.toJSON() : null;
  }

  async update(id, patch) {
    const task = await this.model.findByPk(id);
    if (!task) return null;
    await task.update(patch);
    return task.toJSON();
  }

  async delete(id) {
    const deletedCount = await this.model.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
