import { Response } from "express";
import { Types } from "mongoose";
import { body, query } from "express-validator";
import { AuthRequest } from "../../types";
import { Candidate } from "../../models/Candidate";
import { AuditLog } from "../../models/AuditLog";
import { tag } from "../../casl/ability.factory";
import { subject } from "@casl/ability";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

export const candidateValidation = [
  body("firstName").notEmpty().trim(),
  body("lastName").notEmpty().trim(),
  body("officeId").isMongoId(),
  body("gender").optional().isIn(["male", "female", "other"]),
  body("dateOfBirthBs").optional().isString(),
  body("dateOfBirthAd").optional().isISO8601(),
  body("passportNumber").optional().isString(),
  body("phone").optional().isString(),
  body("email").optional().isEmail(),
];

export async function listCandidates(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = Math.min(parseInt(req.query.pageSize as string ?? "20"), 100);
  const { search, officeId } = req.query;

  const filter: Record<string, unknown> = {
    tenantId: req.user!.tenantId,
    isDeleted: false,
  };

  // Office officers are auto-scoped to their office
  if (req.user!.roles.includes("ward_officer") && req.user!.officeId) {
    filter.officeId = req.user!.officeId;
  } else if (officeId) {
    filter.officeId = officeId;
  }

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { passportNumber: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { profession: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
      { languages: { $in: [new RegExp(search as string, "i")] } },
    ];
  }

  const [data, total] = await Promise.all([
    Candidate.find(filter)
      .select("-passportNumber -documents")
      .populate("officeId", "officeNumber")
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Candidate.countDocuments(filter),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function createCandidate(req: AuthRequest, res: Response) {
  const candidate = await Candidate.create({ ...req.body, tenantId: req.user!.tenantId });

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    module: "candidates",
    action: "CREATE",
    entityType: "Candidate",
    entityId: candidate._id,
    entityLabel: `${candidate.firstName} ${candidate.lastName}`,
    after: candidate.toObject(),
  });

  return sendSuccess(res, candidate, "Candidate created", 201);
}

export async function getCandidate(req: AuthRequest, res: Response) {
  const candidate = await Candidate.findOne({
    _id: req.params.id,
    tenantId: req.user!.tenantId,
    isDeleted: false,
  }).populate("officeId", "officeNumber nameNp");
  if (!candidate) return sendError(res, 404, "Candidate not found");

  // CASL resource-level check with tag() helper (spread to avoid mutation)
  const tagged = tag("Candidate", candidate.toObject());
  if (req.ability!.cannot("read", subject("Candidate", tagged))) {
    return sendError(res, 403, "Forbidden");
  }

  return sendSuccess(res, candidate);
}

export async function updateCandidate(req: AuthRequest, res: Response) {
  const before = await Candidate.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  if (!before) return sendError(res, 404, "Candidate not found");

  const candidate = await Candidate.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true },
  );

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    module: "candidates",
    action: "UPDATE",
    entityType: "Candidate",
    entityId: candidate!._id,
    entityLabel: `${candidate!.firstName} ${candidate!.lastName}`,
    before: before.toObject(),
    after: candidate!.toObject(),
  });

  return sendSuccess(res, candidate, "Candidate updated");
}

export async function deleteCandidate(req: AuthRequest, res: Response) {
  const candidate = await Candidate.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId },
    { isDeleted: true },
    { new: true },
  );
  if (!candidate) return sendError(res, 404, "Candidate not found");

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    module: "candidates",
    action: "DELETE",
    entityType: "Candidate",
    entityId: candidate._id,
    entityLabel: `${candidate.firstName} ${candidate.lastName}`,
  });

  return sendSuccess(res, null, "Candidate deleted");
}

export async function approveCandidate(req: AuthRequest, res: Response) {
  const { status } = req.body; // 'approved' or 'rejected'
  
  if (!["approved", "rejected"].includes(status)) {
    return sendError(res, 400, "Invalid status. Must be 'approved' or 'rejected'.");
  }

  const candidate = await Candidate.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { status, isVerified: status === "approved" },
    { new: true },
  );

  if (!candidate) return sendError(res, 404, "Candidate not found");

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    module: "candidates",
    action: "APPROVE",
    entityType: "Candidate",
    entityId: candidate._id,
    entityLabel: `${candidate.firstName} ${candidate.lastName}`,
    description: `Candidate marked as ${status}`
  });

  return sendSuccess(res, candidate, `Candidate ${status}`);
}

export async function uploadCandidateDocument(req: AuthRequest, res: Response) {
  // Mocking file upload endpoint to satisfy Phase 1 requirement
  // Assuming a middleware handles the file and places it in req.file (e.g. multer-s3)
  const candidate = await Candidate.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  if (!candidate) return sendError(res, 404, "Candidate not found");

  const { type } = req.body;
  if (!type) return sendError(res, 400, "Document type is required");

  const fileUrl = (req as any).file?.location || "mock_url_until_multer_s3_configured";

  candidate.documents = candidate.documents || [];
  candidate.documents.push({
    fileUrl,
    type,
    uploadedAt: new Date(),
    uploadedBy: req.user!.id as unknown as Types.ObjectId,
    verified: false,
  });

  await candidate.save();
  return sendSuccess(res, candidate, "Document uploaded");
}

export async function deleteCandidateDocument(req: AuthRequest, res: Response) {
  const candidate = await Candidate.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  if (!candidate) return sendError(res, 404, "Candidate not found");

  const docId = req.params.docId;
  candidate.documents = candidate.documents?.filter(doc => doc._id?.toString() !== docId);

  await candidate.save();
  return sendSuccess(res, candidate, "Document deleted");
}
