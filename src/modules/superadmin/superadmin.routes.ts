import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import {
  getTenants,
  createTenant,
  updateTenant,
  suspendTenant,
  impersonateTenant,
  getPlans,
  handleStripeWebhook,
  getUsageAnalytics,
  getTickets,
  updateTicket,
  getApiKeys,
  createApiKey,
  deleteApiKey
} from "./superadmin.controller";

const router = Router();

// Webhooks shouldn't require our JWT
router.post("/subscriptions/webhook", handleStripeWebhook);

router.use(authenticate);

// Note: Ensure auth middleware blocks non-superadmins from accessing /admin endpoints
// This could be a custom superAdminOnly middleware, but we will assume standard auth + CASL for now.
router.get("/tenants", authorize("read", "Tenant"), getTenants);
router.post("/tenants", authorize("create", "Tenant"), createTenant);
router.patch("/tenants/:id", authorize("update", "Tenant"), updateTenant);
router.post("/tenants/:id/suspend", authorize("update", "Tenant"), suspendTenant);
router.post("/tenants/:id/impersonate", authorize("update", "Tenant"), impersonateTenant);

router.get("/plans", authorize("read", "Tenant"), getPlans);
router.get("/analytics/usage", authorize("read", "Tenant"), getUsageAnalytics);

router.get("/support/tickets", authorize("read", "Tenant"), getTickets);
router.patch("/support/tickets/:id", authorize("update", "Tenant"), updateTicket);

router.get("/api-keys", authorize("read", "Tenant"), getApiKeys);
router.post("/api-keys", authorize("create", "Tenant"), createApiKey);
router.delete("/api-keys/:id", authorize("delete", "Tenant"), deleteApiKey);

export default router;
