import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import morgan from "morgan";
import { env } from "./config/env";
import logger from "./config/logger";
import { publicRateLimit } from "./middleware/rateLimit.middleware";
import { GlobalExceptionHandler } from "./middleware/error.middleware";
import mongoose from "mongoose";
import { redis } from "./config/redis";

import { apiReference } from "@scalar/express-api-reference";
import openapiSpec from "./docs/openapi.json";

// Routes
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/users.routes";
import rbacRoutes from "./modules/rbac/rbac.routes";
import wardRoutes from "./modules/offices/offices.routes";
import citizenRoutes from "./modules/candidates/candidates.routes";
import employerRoutes from "./modules/employers/employers.routes";
import demandRoutes from "./modules/demands/demands.routes";
import pipelineRoutes from "./modules/pipeline/pipeline.routes";
import taskRoutes from "./modules/tasks/tasks.routes";
import medicalRoutes from "./modules/medical/medical.routes";
import visaRoutes from "./modules/visa/visa.routes";
import ticketRoutes from "./modules/ticket/ticket.routes";
import deploymentRoutes from "./modules/deployment/deployment.routes";
import calendarRoutes from "./modules/calendar/calendar.routes";
import employerPortalRoutes from "./modules/portals/employer/employer-portal.routes";
import candidatePortalRoutes from "./modules/portals/candidate/candidate-portal.routes";
import agentPortalRoutes from "./modules/portals/agent/agent-portal.routes";
import documentRoutes from "./modules/documents/documents.routes";
import contractRoutes from "./modules/contracts/contracts.routes";
import communicationRoutes from "./modules/communications/communications.routes";
import financeRoutes from "./modules/finance/finance.routes";
import complianceRoutes from "./modules/compliance/compliance.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import reportsRoutes from "./modules/reports/reports.routes";
import aiRoutes from "./modules/ai/ai.routes";
import superadminRoutes from "./modules/superadmin/superadmin.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import auditRoutes from "./modules/audit/audit.routes";
import notificationRoutes from "./modules/notifications/notifications.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import systemRoutes from "./modules/system/system.routes";
import featureFlagsRoutes from "./modules/feature-flags/feature-flags.routes";
import onboardingRoutes from "./modules/onboarding/onboarding.routes";
import whatsappRoutes from "./modules/whatsapp/whatsapp.routes";

const app = express();

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      "img-src": ["'self'", "data:", "https://cdn.jsdelivr.net", "https://validator.swagger.io"],
    },
  },
}));
app.use(cors({ origin: env.ALLOWED_ORIGINS, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(publicRateLimit);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  const redisStatus = redis.status === "ready" ? "connected" : "disconnected";
  const isHealthy = dbStatus === "connected" && redisStatus === "connected";
  const status = isHealthy ? "ok" : "degraded";

  let message = "All core services and dependencies are fully operational.";
  if (!isHealthy) {
    const issues = [];
    if (dbStatus === "disconnected") issues.push("Database (MongoDB)");
    if (redisStatus === "disconnected") issues.push("Cache (Redis)");
    message = `The API is running, but with degraded functionality. Unreachable dependencies: ${issues.join(", ")}.`;
  }

  res.json({ 
    status, 
    message,
    service: "palika-os-api", 
    timestamp: new Date().toISOString(),
    dependencies: {
      database: {
        status: dbStatus,
        message: dbStatus === "connected" ? "Successfully connected to MongoDB" : "Failed to connect to MongoDB. Core data cannot be read or written."
      },
      redis: {
        status: redisStatus,
        message: redisStatus === "connected" ? "Successfully connected to Redis" : "Failed to connect to Redis. Rate limiting, sockets, or caching may fallback or fail."
      }
    }
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const v1 = express.Router();

v1.use("/auth",              authRoutes);
v1.use("/users",             userRoutes);
v1.use("/roles",             rbacRoutes);
v1.use("/offices",             wardRoutes);
v1.use("/candidates",          citizenRoutes);
v1.use("/employers",           employerRoutes);
v1.use("/demands",           demandRoutes);
v1.use("/pipeline",          pipelineRoutes);
v1.use("/tasks",             taskRoutes);
v1.use("/medical",           medicalRoutes);
v1.use("/visa",              visaRoutes);
v1.use("/ticket",            ticketRoutes);
v1.use("/deployment",        deploymentRoutes);
v1.use("/calendar",          calendarRoutes);

// Portals
v1.use("/portal/employer",   employerPortalRoutes);
v1.use("/portal/candidate",  candidatePortalRoutes);
v1.use("/portal/agent",      agentPortalRoutes);

// Phase 5: Docs, Contracts, Comms
v1.use("/documents",         documentRoutes);
v1.use("/contracts",         contractRoutes);
v1.use("/communications",    communicationRoutes);

// Phase 6: Finance & Compliance
v1.use("/finance",           financeRoutes); // Note: finance routes have /invoices, /expenses, /commissions in the router
v1.use("/compliance",        complianceRoutes);

// Phase 7: Analytics & Reporting
v1.use("/analytics",         analyticsRoutes);
v1.use("/reports",           reportsRoutes);

// Phase 8: AI Layer
v1.use("/ai",                aiRoutes);

// Phase 9: SaaS Admin Panel
v1.use("/admin",             superadminRoutes);

v1.use("/dashboard",         dashboardRoutes);
v1.use("/audit-logs",        auditRoutes);
v1.use("/notifications",     notificationRoutes);
v1.use("/upload",            uploadRoutes);
v1.use("/system",            systemRoutes);
v1.use("/feature-flags",     featureFlagsRoutes);
v1.use("/onboarding",        onboardingRoutes);
v1.use("/whatsapp",          whatsappRoutes);

app.use("/api/v1", v1);

// ─── API Documentation ──────────────────────────────────────────────────────────
app.use(
  "/reference",
  apiReference({
    theme: "purple",
    spec: {
      content: openapiSpec,
    },
  })
);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(GlobalExceptionHandler);

export default app;
