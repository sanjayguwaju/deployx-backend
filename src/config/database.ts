import mongoose from "mongoose";
import { env } from "./env";
import logger from "./logger";
import { tenantPlugin } from "../plugins/tenant.plugin";

mongoose.plugin(tenantPlugin);

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, { maxPoolSize: 10 });
    logger.info("MongoDB connected");
  } catch (err) {
    logger.error("MongoDB connection failed:", err);
    process.exit(1);
  }
  mongoose.connection.on("error", (err) => logger.error("MongoDB error:", err));
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
}
