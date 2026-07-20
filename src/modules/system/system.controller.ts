import { Request, Response } from "express";
import { AuthRequest } from "../../types";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import { redis } from "../../config/redis";
import { Tenant } from "../../models/Tenant";

export async function getRedisStats(req: AuthRequest, res: Response) {
  try {
    const info = await redis.info();
    const dbsize = await redis.dbsize();
    
    // Parse memory usage from info string
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    const usedMemory = memoryMatch ? memoryMatch[1] : "Unknown";

    return sendSuccess(res, {
      status: redis.status,
      keysCount: dbsize,
      usedMemory,
    });
  } catch (error) {
    return sendError(res, 500, "Failed to get Redis stats");
  }
}

export async function clearRedisCache(req: AuthRequest, res: Response) {
  try {
    const { target = "all" } = req.body;
    
    let keysToDelete: string[] = [];
    
    // We use keys() here instead of flushdb to avoid deleting background job queues (like BullMQ)
    if (target === "permissions" || target === "all") {
      const permKeys = await redis.keys("permissions:role:*");
      keysToDelete.push(...permKeys);
    }
    
    if (target === "sessions" || target === "all") {
      const sessionKeys = await redis.keys("session:user:*");
      keysToDelete.push(...sessionKeys);
    }

    if (keysToDelete.length > 0) {
      await redis.del(keysToDelete);
    }

    return sendSuccess(res, { cleared: keysToDelete.length }, `Successfully cleared ${keysToDelete.length} cache keys`);
  } catch (error) {
    return sendError(res, 500, "Failed to clear Redis cache");
  }
}

export async function getTenants(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || "";

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { subdomain: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Tenant.countDocuments(query);
    const tenants = await Tenant.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return sendPaginated(res, tenants, total, page, limit);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch tenants");
  }
}

export async function updateTenantStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return sendError(res, 400, "Invalid status");
    }

    const tenant = await Tenant.findByIdAndUpdate(id, { status }, { new: true });
    if (!tenant) {
      return sendError(res, 404, "Tenant not found");
    }

    return sendSuccess(res, tenant, `Tenant status updated to ${status}`);
  } catch (error) {
    return sendError(res, 500, "Failed to update tenant status");
  }
}

export async function updateTenant(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, subdomain, type, code } = req.body;

    const tenant = await Tenant.findByIdAndUpdate(
      id,
      { name, subdomain, type, code },
      { new: true }
    );
    if (!tenant) {
      return sendError(res, 404, "Tenant not found");
    }

    return sendSuccess(res, tenant, "Tenant updated successfully");
  } catch (error) {
    return sendError(res, 500, "Failed to update tenant");
  }
}

export async function deleteTenant(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findByIdAndDelete(id);
    if (!tenant) {
      return sendError(res, 404, "Tenant not found");
    }

    return sendSuccess(res, null, "Tenant deleted successfully");
  } catch (error) {
    return sendError(res, 500, "Failed to delete tenant");
  }
}

export async function getTenantBranding(req: Request, res: Response) {
  try {
    const { subdomain } = req.params;
    const tenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase() }).select("name logoUrl themeConfig");
    
    if (!tenant) {
      return sendError(res, 404, "Tenant not found");
    }

    return sendSuccess(res, {
      name: tenant.name,
      logoUrl: tenant.logoUrl || null,
      primaryColor: tenant.themeConfig?.primaryColor || "#1C2434"
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch tenant branding");
  }
}

export async function updateTenantSettings(req: AuthRequest, res: Response) {
  try {
    if (!req.user || !req.user.roles.includes("tenant_admin")) {
      return sendError(res, 403, "Forbidden: Only Tenant Admins can update settings");
    }

    const { logoUrl, primaryColor, name } = req.body;
    
    const updateData: any = {};
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (primaryColor !== undefined) updateData["themeConfig.primaryColor"] = primaryColor;
    if (name !== undefined) updateData.name = name;

    const tenant = await Tenant.findByIdAndUpdate(
      req.user.tenantId,
      { $set: updateData },
      { new: true }
    );

    return sendSuccess(res, tenant, "Tenant settings updated successfully");
  } catch (error) {
    return sendError(res, 500, "Failed to update tenant settings");
  }
}
