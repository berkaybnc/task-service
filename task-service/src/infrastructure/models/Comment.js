import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: String,
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  mentions: [String]
}, { timestamps: true });

const Comment = mongoose.model("Comment", CommentSchema);

export default Comment;
