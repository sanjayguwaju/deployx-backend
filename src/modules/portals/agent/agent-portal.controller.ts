import { Response } from "express";
import { AuthRequest } from "../../../types";
import { Candidate } from "../../../models/Candidate";
import { Tenant } from "../../../models/Tenant";
import { Pipeline } from "../../../models/Pipeline";
import { AuditLog } from "../../../models/AuditLog";
import { Commission } from "../../../models/Commission";
import { sendSuccess, sendError, sendPaginated } from "../../../utils/response";

export async function getAgentCandidates(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");

  const filter = {
    tenantId: req.user!.tenantId,
    referringAgentId: req.user!.id,
    isDeleted: false,
  };

  const [data, total] = await Promise.all([
    Candidate.find(filter)
      .select("firstName lastName profession status createdAt isVerified")
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort("-createdAt"),
    Candidate.countDocuments(filter),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function getAgentCommissions(req: AuthRequest, res: Response) {
  const commissions = await Commission.find({
    tenantId: req.user!.tenantId,
    agentId: req.user!.id
  }).sort("-createdAt");

  return sendSuccess(res, commissions);
}

export async function getAgentLeaderboard(req: AuthRequest, res: Response) {
  const tenant = await Tenant.findById(req.user!.tenantId);
  if (!tenant?.portalSettings?.agentLeaderboardEnabled) {
    return sendError(res, 403, "Leaderboard is disabled by your agency");
  }

  const leaderboard = await Candidate.aggregate([
    { $match: { tenantId: req.user!.tenantId, isDeleted: false, referringAgentId: { $ne: null } } },
    { $group: { _id: "$referringAgentId", totalReferrals: { $sum: 1 } } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "agent" } },
    { $unwind: "$agent" },
    { $project: { agentName: "$agent.name", totalReferrals: 1 } },
    { $sort: { totalReferrals: -1 } }
  ]);

  return sendSuccess(res, leaderboard);
}

export async function submitReferral(req: AuthRequest, res: Response) {
  const candidate = await Candidate.create({
    ...req.body,
    tenantId: req.user!.tenantId,
    // fallback to user's officeId if not provided (agents might not have officeId but they must provide one or fallback)
    officeId: req.body.officeId || req.user!.officeId,
    referringAgentId: req.user!.id,
    status: "registered",
    isVerified: false
  });

  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "candidates", action: "CREATE", entityType: "Candidate",
    entityId: candidate._id, entityLabel: `Agent Referral: ${candidate.firstName}`,
  });

  return sendSuccess(res, candidate, "Referral submitted successfully", 201);
}
