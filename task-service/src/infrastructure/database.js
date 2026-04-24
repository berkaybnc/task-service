import mongoose from "mongoose";
import { env } from "../config/env.js";
import pino from "pino";

const logger = pino();

const connectDB = async () => {
  try {
    if (!env.mongodbUri) {
      throw new Error("MONGODB_URI is not defined");
    }
    await mongoose.connect(env.mongodbUri);
    logger.info("MongoDB connected (Task Service)");
  } catch (err) {
    logger.error({ err }, "MongoDB connection failed");
    process.exit(1);
  }
};

export default connectDB;
export { mongoose };
