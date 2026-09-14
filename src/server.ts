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

  const primaryPort = env.PORT || 8081;
  server.listen(primaryPort, () => {
    logger.info(`DeployX API started on primary port ${primaryPort}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`Health: http://localhost:${primaryPort}/health`);
    logger.info(`API: http://localhost:${primaryPort}/api/v1`);
  });

  // Dual-listen on common deployment ports to prevent 502 Bad Gateway from Coolify port mismatches
  const altServers: any[] = [];
  const candidatePorts = [3000, 8081, 4000].filter((p) => p !== primaryPort);
  for (const altPort of candidatePorts) {
    const altServer = createServer(app);
    altServer.listen(altPort, () => {
      logger.info(`DeployX API also listening on port ${altPort}`);
    }).on("error", (err: any) => {
      logger.warn(`Port ${altPort} not bound (non-fatal): ${err.message}`);
    });
    altServers.push(altServer);
  }

  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received — shutting down gracefully");
    server.close();
    altServers.forEach(s => s.close());
    await redis.quit().catch(() => {});
    process.exit(0);
  });
}

start().catch((err) => {
  logger.error("Startup failed:", err);
  process.exit(1);
});
