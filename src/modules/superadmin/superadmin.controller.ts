import { Response } from "express";
import { AuthRequest } from "../../types";
import { Tenant } from "../../models/Tenant";
import { Plan } from "../../models/Plan";
import { Subscription } from "../../models/Subscription";
import { SupportTicket } from "../../models/SupportTicket";
import { ApiKey } from "../../models/ApiKey";
import { AuditLog } from "../../models/AuditLog";
import { User } from "../../models/User";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

// 1. Tenant Management
export async function getTenants(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");
  
  const [data, total] = await Promise.all([
    Tenant.find().skip((page - 1) * pageSize).limit(pageSize).sort("-createdAt"),
    Tenant.countDocuments()
  ]);
  
  return sendPaginated(res, data, total, page, pageSize);
}

export async function createTenant(req: AuthRequest, res: Response) {
  const tenant = await Tenant.create({
    ...req.body,
    status: "trial",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
  });
  return sendSuccess(res, tenant, "Tenant created successfully", 201);
}

export async function updateTenant(req: AuthRequest, res: Response) {
  const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!tenant) return sendError(res, 404, "Tenant not found");
  return sendSuccess(res, tenant, "Tenant updated successfully");
}

export async function suspendTenant(req: AuthRequest, res: Response) {
  const tenant = await Tenant.findByIdAndUpdate(req.params.id, { status: "suspended" }, { new: true });
  if (!tenant) return sendError(res, 404, "Tenant not found");
  
  // Note: auth middleware will need to reject tokens for suspended tenants
  return sendSuccess(res, tenant, "Tenant suspended successfully");
}

// 2. Impersonation (Critical path)
export async function impersonateTenant(req: AuthRequest, res: Response) {
  const { reason } = req.body;
  if (!reason) return sendError(res, 400, "A valid reason must be provided to impersonate a tenant.");

  const tenant = await Tenant.findById(req.params.id);
  if (!tenant) return sendError(res, 404, "Tenant not found");

  // Find the primary admin of the tenant
  const tenantAdmin = await User.findOne({ tenantId: tenant._id, roles: "admin" });
  if (!tenantAdmin) return sendError(res, 404, "No admin user found for this tenant");

  // Mandatory Audit Log
  await AuditLog.create({
    tenantId: tenant._id,
    actorId: req.user!.id,
    module: "superadmin",
    action: "IMPERSONATE",
    entityType: "Tenant",
    entityId: tenant._id,
    entityLabel: `Impersonated by ${req.user!.id}. Reason: ${reason}`
  });

  // Issue scoped token
  const token = jwt.sign(
    { 
      id: tenantAdmin._id, 
      tenantId: tenant._id, 
      roles: tenantAdmin.roles,
      impersonatedBy: req.user!.id // Traceability inside the token itself
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return sendSuccess(res, { token, impersonatedUser: tenantAdmin.email }, "Impersonation session started");
}

// 3. Billing & Webhooks
export async function getPlans(req: AuthRequest, res: Response) {
  const plans = await Plan.find({ isActive: true });
  return sendSuccess(res, plans);
}

export async function handleStripeWebhook(req: AuthRequest, res: Response) {
  // In a real integration, this verifies the Stripe signature first
  const { type, data } = req.body;

  if (type === "customer.subscription.updated" || type === "customer.subscription.deleted") {
    const stripeSubId = data.object.id;
    const stripeStatus = data.object.status;

    const subscription = await Subscription.findOne({ stripeSubscriptionId: stripeSubId });
    if (subscription) {
      subscription.status = stripeStatus === "active" ? "active" : 
                            stripeStatus === "canceled" ? "cancelled" : "past_due";
      await subscription.save();

      // Reflect on Tenant
      const tenant = await Tenant.findById(subscription.tenantId);
      if (tenant) {
        tenant.status = subscription.status === "active" ? "active" : 
                        subscription.status === "cancelled" ? "suspended" : "suspended";
        await tenant.save();
      }
    }
  }

  return sendSuccess(res, null, "Webhook processed");
}

// 4. Analytics
export async function getUsageAnalytics(req: AuthRequest, res: Response) {
  const activeTenants = await Tenant.countDocuments({ status: "active" });
  const trialTenants = await Tenant.countDocuments({ status: "trial" });
  const suspendedTenants = await Tenant.countDocuments({ status: "suspended" });

  const aiAdoption = await Tenant.countDocuments({ "featureFlags.aiLayer": true });

  return sendSuccess(res, {
    activeTenants,
    trialTenants,
    suspendedTenants,
    aiAdoption
  });
}

// 5. Support Tickets
export async function getTickets(req: AuthRequest, res: Response) {
  const tickets = await SupportTicket.find().sort("-createdAt").populate("tenantId", "name");
  return sendSuccess(res, tickets);
}

export async function updateTicket(req: AuthRequest, res: Response) {
  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!ticket) return sendError(res, 404, "Ticket not found");
  return sendSuccess(res, ticket, "Ticket updated");
}

// 6. API Keys
export async function getApiKeys(req: AuthRequest, res: Response) {
  const keys = await ApiKey.find({ tenantId: req.user!.tenantId });
  return sendSuccess(res, keys);
}

export async function createApiKey(req: AuthRequest, res: Response) {
  const rawKey = require("crypto").randomBytes(32).toString("hex");
  const keyHash = require("crypto").createHash("sha256").update(rawKey).digest("hex");
  
  const apiKey = await ApiKey.create({
    tenantId: req.user!.tenantId,
    name: req.body.name,
    keyHash,
    prefix: rawKey.substring(0, 8)
  });

  return sendSuccess(res, { key: rawKey, record: apiKey }, "Store this key safely, it will not be shown again", 201);
}

export async function deleteApiKey(req: AuthRequest, res: Response) {
  await ApiKey.findOneAndDelete({ _id: req.params.id, tenantId: req.user!.tenantId });
  return sendSuccess(res, null, "API key deleted");
}
