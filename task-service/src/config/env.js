import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export const env = {
  PORT: Number(process.env.PORT) || 8080,
  JWT_SECRET,
  NOTIFICATION_SERVICE_URL:
    process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3003",
  mongodbUri: process.env.MONGODB_URI,
  redisUrl: process.env.REDIS_URL,
  internalApiKey: process.env.INTERNAL_API_KEY,
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || "http://localhost:5001"
};