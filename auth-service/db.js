const mongoose = require("mongoose");
const logger = require("./logger");

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is required");
  }
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info("MongoDB connected successfully");
  } catch (err) {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
