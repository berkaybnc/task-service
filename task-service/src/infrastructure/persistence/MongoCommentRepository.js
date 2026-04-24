import Comment from "../models/Comment.js";

export class MongoCommentRepository {
  async create(commentData) {
    const comment = new Comment(commentData);
    return await comment.save();
  }

  async findByTaskId(taskId) {
    return await Comment.find({ taskId }).sort({ createdAt: 1 });
  }

  async delete(id) {
    const res = await Comment.findByIdAndDelete(id);
    return !!res;
  }
}
