import { Response } from "express";
import { AuthRequest } from "../../types";
import { FeatureFlag } from "../../models/FeatureFlag";
import { sendSuccess, sendError } from "../../utils/response";

export const SYSTEM_FEATURE_FLAGS = [
  { key: "citizen_portal", name: "Candidate Portal", description: "Enable the public candidate portal", isSystemFlag: true },
  { key: "online_payment", name: "Online Payment", description: "Enable online tax payment", isSystemFlag: true },
  { key: "sms_notifications", name: "SMS Notifications", description: "Send SMS alerts to candidates", isSystemFlag: true },
  { key: "property_tax", name: "Property Tax", description: "Property tax collection module", isSystemFlag: true },
  { key: "grievance_system", name: "Grievance System", description: "Candidate grievance and complaint handling", isSystemFlag: true },
  { key: "sifaris_module", name: "Sifaris Module", description: "Digital recommendation letters issuance", isSystemFlag: true },
  { key: "ward_dashboard", name: "Office Dashboard", description: "Dedicated dashboard for office offices", isSystemFlag: true },
  { key: "vital_events", name: "Vital Events", description: "Birth, death, marriage registration", isSystemFlag: true },
  { key: "health_post", name: "Health Post", description: "Health post and clinic management", isSystemFlag: true },
  { key: "school_management", name: "School Management", description: "Public school monitoring module", isSystemFlag: true },
  { key: "infrastructure", name: "Infrastructure", description: "Infrastructure projects tracking", isSystemFlag: true },
  { key: "livestock", name: "Livestock & Agri", description: "Agriculture and livestock management", isSystemFlag: true },
  { key: "digital_notice", name: "Digital Notice Board", description: "Digital public announcements", isSystemFlag: true },
  { key: "inventory", name: "Inventory Management", description: "Internal municipal inventory tracking", isSystemFlag: true },
  { key: "disaster_mgmt", name: "Disaster Mgmt", description: "Disaster and relief management", isSystemFlag: true },
  { key: "citizen_charter", name: "Candidate Charter", description: "Digital candidate charter display", isSystemFlag: true },
  { key: "e_attendance", name: "E-Attendance", description: "Staff electronic attendance", isSystemFlag: true },
  { key: "budget_allocation", name: "Budget Allocation", description: "Budget tracking and allocation", isSystemFlag: true },
  { key: "waste_management", name: "Waste Management", description: "Waste collection tracking", isSystemFlag: true },
  { key: "business_registration", name: "Business Reg.", description: "Local business registration module", isSystemFlag: true }
];

import { tenantContext } from "../../utils/tenantContext";

export async function getSystemFeatureFlags(req: AuthRequest, res: Response) {
  const dbSystemFlags = await tenantContext.run(
    { bypassTenant: true, tenantId: "system" },
    () => FeatureFlag.find({ isSystemFlag: true })
  );
  
  // Create a map to deduplicate by key (preferring DB over hardcoded)
  const flagsMap = new Map();
  
  SYSTEM_FEATURE_FLAGS.forEach(f => flagsMap.set(f.key, f));
  dbSystemFlags.forEach(f => flagsMap.set(f.key, {
    key: f.key,
    name: f.name,
    description: f.description,
    isSystemFlag: true
  }));

  const combinedFlags = Array.from(flagsMap.values());
  console.log("COMBINED FLAGS COUNT:", combinedFlags.length);
  return sendSuccess(res, combinedFlags);
}

export async function createSystemFeatureFlag(req: AuthRequest, res: Response) {
  try {
    const { key, name, description } = req.body;
    if (!key || !name) {
      return sendError(res, 400, "Key and name are required");
    }
    
    // Check if it already exists in DB
    const existing = await FeatureFlag.findOne({ key, isSystemFlag: true });
    if (existing) {
      return sendError(res, 400, "A system feature flag with this key already exists");
    }

    const flag = await FeatureFlag.create({
      key,
      name,
      description,
      isSystemFlag: true,
      isActive: false // System flag definitions themselves don't dictate active state
    });
    
    return sendSuccess(res, flag, "System feature flag created", 201);
  } catch (err: any) {
    if (err.code === 11000) {
      return sendError(res, 400, "A system feature flag with this key already exists");
    }
    throw err;
  }
}

export async function listFeatureFlags(req: AuthRequest, res: Response) {
  const query: any = {};
  const isSuperAdmin = req.user?.roles?.includes("platform_admin");
  
  if (!isSuperAdmin && req.user?.tenantId) {
    query.tenantId = req.user.tenantId;
  }

  const flags = await tenantContext.run(
    { bypassTenant: isSuperAdmin, tenantId: req.user?.tenantId },
    () => FeatureFlag.find(query).sort("name")
  );
  return sendSuccess(res, flags);
}

export async function createFeatureFlag(req: AuthRequest, res: Response) {
  try {
    const flagData = { ...req.body };
    if (req.user?.tenantId && !flagData.tenantId) {
      flagData.tenantId = req.user.tenantId;
    }
    const flag = await FeatureFlag.create(flagData);
    return sendSuccess(res, flag, "Feature flag created", 201);
  } catch (err: any) {
    if (err.code === 11000) {
      return sendError(res, 400, "A feature flag with this key already exists");
    }
    throw err;
  }
}

export async function updateFeatureFlag(req: AuthRequest, res: Response) {
  const query: any = { _id: req.params.id };
  if (req.user?.tenantId) query.tenantId = req.user.tenantId;
  const flag = await FeatureFlag.findOneAndUpdate(
    query,
    { $set: req.body },
    { new: true }
  );
  if (!flag) return sendError(res, 404, "Feature flag not found");
  return sendSuccess(res, flag, "Feature flag updated");
}

export async function deleteFeatureFlag(req: AuthRequest, res: Response) {
  const query: any = { _id: req.params.id };
  if (req.user?.tenantId) query.tenantId = req.user.tenantId;
  const flag = await FeatureFlag.findOneAndDelete(query);
  if (!flag) return sendError(res, 404, "Feature flag not found");
  return sendSuccess(res, null, "Feature flag deleted");
}
