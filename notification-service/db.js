const mongoose = require("mongoose");
const logger = require("./logger");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required");
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info("MongoDB connected (Notification Service)");
  } catch (err) {
    logger.error({ err }, "MongoDB connection failed");
    process.exit(1);
  }
};

module.exports = connectDB;
