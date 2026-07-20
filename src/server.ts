import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import { redis } from "./config/redis";
import app from "./app";
import logger from "./config/logger";

import { createServer } from "http";
import { initSocket } from "./config/socket";
import "./workers/expiry.worker"; // Initialize cron jobs

async function start() {
  await connectDatabase();
  // Redis connection is lazy — try to connect but don't block startup
  redis.connect().catch(() => {});

  const server = createServer(app);
  initSocket(server);

  server.listen(env.PORT, () => {
    logger.info(`PalikaOS API started on port ${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`Health: http://localhost:${env.PORT}/health`);
    logger.info(`API: http://localhost:${env.PORT}/api/v1`);
  });

  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received — shutting down gracefully");
    await redis.quit().catch(() => {});
    process.exit(0);
  });
}

start().catch((err) => {
  logger.error("Startup failed:", err);
  process.exit(1);
});
