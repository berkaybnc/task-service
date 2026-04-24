const mongoose = require("mongoose");
const logger = require("./logger");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required");
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info("MongoDB connected successfully (Task Service)");
  } catch (err) {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
