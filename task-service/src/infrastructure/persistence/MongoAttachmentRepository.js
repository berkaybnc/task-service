import Attachment from "../models/Attachment.js";

export class MongoAttachmentRepository {
  /**
   * Yeni bir ek kaydet.
   * @param {Object} data - { taskId, uploadedBy, filename, mimetype, size, data }
   */
  async create(data) {
    const attachment = new Attachment(data);
    return await attachment.save();
  }

  /**
   * Bir göreve ait tüm eklerin meta bilgisini döndür (data Buffer hariç).
   */
  async findByTaskId(taskId) {
    return await Attachment.find({ taskId }, "-data").sort({ createdAt: -1 });
  }

  /**
   * Tek bir eki id ile getir (data Buffer dahil).
   */
  async findById(id) {
    return await Attachment.findById(id);
  }

  /**
   * Eki sil.
   */
  async delete(id) {
    const res = await Attachment.findByIdAndDelete(id);
    return !!res;
  }
}
