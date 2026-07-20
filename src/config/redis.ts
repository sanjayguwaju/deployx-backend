import IORedis from "ioredis";
import { env } from "./env";
import logger from "./logger";

export const redis = env.REDIS_URL
  ? new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true })
  : new IORedis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => logger.warn("Redis unavailable (non-fatal):", err.message));
