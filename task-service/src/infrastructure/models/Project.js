import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  teamId: String,
  description: String,
  status: { type: String, default: "active" }
}, { timestamps: true });

const Project = mongoose.model("Project", ProjectSchema);

export default Project;
