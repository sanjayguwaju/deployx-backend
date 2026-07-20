import { Router, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { AuthRequest } from "../../types";
import { getRedisStats, clearRedisCache, getTenants, updateTenantStatus, getTenantBranding, updateTenantSettings, updateTenant, deleteTenant } from "./system.controller";

const router = Router();

// Public route for frontend to fetch branding BEFORE login
router.get("/tenant/:subdomain/branding", getTenantBranding);

router.use(authenticate);

// Authenticated route for tenant admins to update their own branding
router.patch("/tenant/settings", updateTenantSettings);

// Restrict these dangerous endpoints to Platform Admins only
router.use((req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.roles.includes("platform_admin")) {
    return res.status(403).json({ success: false, message: "Forbidden: Platform Admin only" });
  }
  next();
});

router.get("/redis", getRedisStats);
router.post("/redis/clear", clearRedisCache);

router.get("/tenants", getTenants);
router.put("/tenants/:id/status", updateTenantStatus);
router.put("/tenants/:id", updateTenant);
router.delete("/tenants/:id", deleteTenant);

export default router;
