import Redis from "ioredis";
import { env } from "../config/env.js";
import pino from "pino";

const logger = pino();

class CacheService {
  constructor() {
    if (env.redisUrl) {
      this.redis = new Redis(env.redisUrl, {
        maxRetriesPerRequest: 3,
      });
      this.redis.on("error", (err) => logger.error({ err }, "Redis Error"));
      this.redis.on("connect", () => logger.info("Connected to Redis"));
    } else {
      logger.warn("Redis URL not found, caching disabled");
    }
  }

  async get(key) {
    if (!this.redis) return null;
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error({ err }, "Redis Get Error");
      return null;
    }
  }

  async set(key, value, ttl = 60) {
    if (!this.redis) return;
    try {
      await this.redis.set(key, JSON.stringify(value), "EX", ttl);
    } catch (err) {
      logger.error({ err }, "Redis Set Error");
    }
  }

  async del(key) {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
    } catch (err) {
      logger.error({ err }, "Redis Del Error");
    }
  }

  async flush() {
    if (!this.redis) return;
    try {
      await this.redis.flushall();
    } catch (err) {
      logger.error({ err }, "Redis Flush Error");
    }
  }
}

export const cache = new CacheService();
export default cache;
