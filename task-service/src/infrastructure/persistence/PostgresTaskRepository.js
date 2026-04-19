import { DataTypes } from "sequelize";
import sequelize from "../database.js";

const ProjectModel = sequelize.define("Project", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  teamId: {
    type: DataTypes.UUID,
    allowNull: true, // Optional for personal projects, but teams will use it
  },
});

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
  projectId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  assigneeId: {
    type: DataTypes.STRING, // Using username or uuid
    allowNull: true,
  }
});

TaskModel.belongsTo(ProjectModel, { foreignKey: 'projectId' });
ProjectModel.hasMany(TaskModel, { foreignKey: 'projectId' });

export class PostgresTaskRepository {
  constructor() {
    this.model = TaskModel;
    this.projectModel = ProjectModel;
    // Sync table in constructor for simplicity in this project
    this.projectModel.sync({ alter: true });
    this.model.sync({ alter: true });
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

  // Project Methods
  async createProject(data) {
    const project = await this.projectModel.create(data);
    return project.toJSON();
  }

  async findAllProjects() {
    const projects = await this.projectModel.findAll({
      order: [['createdAt', 'ASC']]
    });
    return projects.map(p => p.toJSON());
  }

  async findProjectsByTeam(teamId) {
    const projects = await this.projectModel.findAll({ where: { teamId } });
    return projects.map(p => p.toJSON());
  }
}
