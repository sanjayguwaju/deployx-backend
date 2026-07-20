import { Types } from "mongoose";
import { ApprovableDocument, ApprovableModule } from "../../models/ApprovableDocument";
import { Role } from "../../models/Role";
import { AuthUser } from "../../types";
import { getIO } from "../../config/socket";
import logger from "../../config/logger";

// ─── Role Level Lookup ────────────────────────────────────────────────────────

async function getUserLevel(user: AuthUser): Promise<number> {
  // Find the lowest (most privileged) level among all the user's roles
  const roles = await Role.find({ slug: { $in: user.roles } }).select("level");
  if (!roles.length) return 5;
  return Math.min(...roles.map((r) => r.level));
}

async function getRoleSlugForLevel(level: number, tenantId: string): Promise<string | null> {
  const role = await Role.findOne({ level, tenantId }).select("slug");
  return role?.slug ?? null;
}

// ─── Threshold Configuration ───────────────────────────────────────────────────

export const approvalConfig: Record<string, { maxAmountNpr: number; requiredLevel: number }[]> = {
  infra_payment: [
    { maxAmountNpr: 50_000, requiredLevel: 2 }, // SECTION_HEAD
    { maxAmountNpr: 500_000, requiredLevel: 1 }, // CAO
    { maxAmountNpr: Infinity, requiredLevel: 0 }, // CHAIRPERSON
  ],
  budget_allocation: [
    { maxAmountNpr: Infinity, requiredLevel: 1 }, // CAO
  ],
};

// ─── Service Functions ───────────────────────────────────────────────────────

/**
 * Create an ApprovableDocument for a new record.
 * currentLevelRequired = creator's role level - 1 (one rank up in the hierarchy).
 */
export async function createApproval(
  tenantId: string,
  module: ApprovableModule,
  recordType: string,
  recordId: Types.ObjectId,
  creatorLevel: number,
  amountNpr?: number,
): Promise<typeof ApprovableDocument.prototype> {
  let currentLevelRequired = Math.max(0, creatorLevel - 1);

  // Apply threshold config if this module has monetary tiers
  if (amountNpr !== undefined && approvalConfig[module]) {
    const tiers = approvalConfig[module];
    for (const tier of tiers) {
      if (amountNpr <= tier.maxAmountNpr) {
        currentLevelRequired = tier.requiredLevel;
        break;
      }
    }
  }

  const approval = await ApprovableDocument.create({
    tenantId: new Types.ObjectId(tenantId),
    module,
    recordType,
    recordId,
    currentLevelRequired,
    status: "pending",
    history: [],
  });

  // Notify next approver via Socket.IO
  const nextRoleSlug = await getRoleSlugForLevel(currentLevelRequired, tenantId);
  if (nextRoleSlug) {
    try {
      getIO().to(`role:${nextRoleSlug}`).emit("approval:pending", {
        approvalId: approval._id,
        module,
        recordType,
        recordId,
      });
    } catch {
      logger.warn("Socket.IO not ready — skipping approval notification emit");
    }
  }

  return approval;
}

/**
 * Process an approve or reject action on an ApprovableDocument.
 * Single-step for Phase 2 — status flips immediately on action.
 */
export async function processAction(
  approvalId: string,
  actor: AuthUser,
  action: "approve" | "reject",
  atBs: string,
  comment?: string,
): Promise<typeof ApprovableDocument.prototype | null> {
  const approval = await ApprovableDocument.findById(approvalId);
  if (!approval) return null;
  if (approval.status !== "pending") return approval; // already resolved

  const actorLevel = await getUserLevel(actor);

  // Actor must have a role level <= currentLevelRequired (more privileged or equal)
  if (actorLevel > approval.currentLevelRequired) return null;

  approval.history.push({
    actorId: new Types.ObjectId(actor.id),
    level: actorLevel,
    action,
    atBs,
    comment,
  });

  approval.status = action === "approve" ? "approved" : "rejected";
  await approval.save();

  return approval;
}

/**
 * Fetch all pending approvals that the requesting user can action.
 */
export async function getPendingForUser(
  tenantId: string,
  actor: AuthUser,
) {
  const actorLevel = await getUserLevel(actor);
  return ApprovableDocument.find({
    tenantId: new Types.ObjectId(tenantId),
    status: "pending",
    currentLevelRequired: { $gte: actorLevel },
  }).sort({ createdAt: 1 });
}
