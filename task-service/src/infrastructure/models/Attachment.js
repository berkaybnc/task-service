import mongoose from "mongoose";

const AttachmentSchema = new mongoose.Schema({
  taskId:      { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  uploadedBy:  { type: String, required: true },      // username
  filename:    { type: String, required: true },       // orijinal dosya adı
  mimetype:    { type: String, required: true },
  size:        { type: Number, required: true },       // byte cinsinden
  data:        { type: Buffer, required: true },       // dosya içeriği (GridFS yerine basit Buffer)
}, { timestamps: true });

const Attachment = mongoose.model("Attachment", AttachmentSchema);

export default Attachment;
