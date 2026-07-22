import { Request, Response } from "express";
import { body } from "express-validator";
import { Tenant } from "../../models/Tenant";
import { Role } from "../../models/Role";
import { User } from "../../models/User";
import { sendSuccess, sendError } from "../../utils/response";
import { signAccessToken, signRefreshToken } from "../../utils/jwt";
import bcrypt from "bcryptjs";
import { AuditLog } from "../../models/AuditLog";

export const registerTenantValidation = [
  body("name").notEmpty().withMessage("Tenant name is required"),
  body("subdomain")
    .notEmpty().withMessage("Subdomain is required")
    .matches(/^[a-z0-9-]+$/).withMessage("Subdomain must be lowercase alphanumeric and hyphens only"),
  body("adminName").notEmpty().withMessage("Admin name is required"),
  body("adminEmail").isEmail().normalizeEmail().withMessage("Valid admin email is required"),
  body("adminPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

export async function registerTenant(req: Request, res: Response) {
  const { name, subdomain, adminName, adminEmail, adminPassword } = req.body;

  try {
    // 1. Check if subdomain already exists
    const existingMuni = await Tenant.findOne({ subdomain });
    if (existingMuni) {
      return sendError(res, 400, "Subdomain is already taken");
    }

    // 2. Check if admin email already exists globally
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return sendError(res, 400, "Admin email is already registered");
    }

    // 3. Create Tenant
    const tenant = await Tenant.create({
      name,
      code: subdomain.toUpperCase(),
      subdomain,
      type: "rural",
      totalOffices: 9,
      isActive: true,
    });

    // 4. Create Role
    const adminRole = await Role.create({
      name: "Platform Admin",
      slug: "platform_admin",
      description: "Full system access",
      permissions: [{ module: "all", action: "manage" }],
      tenantId: tenant._id,
      isSystem: true
    });

    // 5. Create Admin User (Platform Admin)
    const user = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      tenantId: tenant._id,
      roles: [adminRole._id],
      rolesSlugs: ["platform_admin"],
      isActive: true,
      designation: "System Administrator",
    });

    // 7. Success Response (No auto-login since approval is required)
    await AuditLog.create({
      tenantId: user.tenantId,
      actorId: user._id,
      actorEmail: user.email,
      module: "system",
      action: "TENANT_CREATED",
      entityType: "Tenant",
      entityId: tenant._id,
      description: `New tenant ${name} registered`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, {
      tenant: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
      }
    }, "Workspace created successfully! It is currently pending verification by our administration team.", 201);

  } catch (err: any) {
    return sendError(res, 500, "Failed to register tenant: " + err.message);
  }
}
