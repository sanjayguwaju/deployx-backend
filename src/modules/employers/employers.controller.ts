import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import { Employer } from "../../models/Employer";
import { AuditLog } from "../../models/AuditLog";
import { tag } from "../../casl/ability.factory";
import { subject } from "@casl/ability";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import { Types } from "mongoose";

export const employerValidation = [
  body("companyName").notEmpty().trim(),
  body("country").notEmpty().trim(),
  body("industry").optional().isString(),
  body("contactPersons").optional().isArray(),
];

export async function listEmployers(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = Math.min(parseInt(req.query.pageSize as string ?? "20"), 100);
  const { search } = req.query;

  const filter: Record<string, unknown> = {
    tenantId: req.user!.tenantId,
    isDeleted: false,
  };

  if (search) {
    filter.$or = [
      { companyName: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
    ];
  }

  const [data, total] = await Promise.all([
    Employer.find(filter).skip((page - 1) * pageSize).limit(pageSize),
    Employer.countDocuments(filter),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function createEmployer(req: AuthRequest, res: Response) {
  const employer = await Employer.create({
    ...req.body,
    tenantId: req.user!.tenantId,
    createdBy: req.user!.id,
  });

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    module: "employers",
    action: "CREATE",
    entityType: "Employer",
    entityId: employer._id,
    entityLabel: employer.companyName,
    after: employer.toObject(),
  });

  return sendSuccess(res, employer, "Employer created", 201);
}

export async function getEmployer(req: AuthRequest, res: Response) {
  const employer = await Employer.findOne({
    _id: req.params.id,
    tenantId: req.user!.tenantId,
    isDeleted: false,
  });
  if (!employer) return sendError(res, 404, "Employer not found");

  const tagged = tag("Employer", employer.toObject());
  if (req.ability!.cannot("read", subject("Employer", tagged))) {
    return sendError(res, 403, "Forbidden");
  }

  return sendSuccess(res, employer);
}

export async function updateEmployer(req: AuthRequest, res: Response) {
  const before = await Employer.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  if (!before) return sendError(res, 404, "Employer not found");

  const employer = await Employer.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true },
  );

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    module: "employers",
    action: "UPDATE",
    entityType: "Employer",
    entityId: employer!._id,
    entityLabel: employer!.companyName,
    before: before.toObject(),
    after: employer!.toObject(),
  });

  return sendSuccess(res, employer, "Employer updated");
}

export async function deleteEmployer(req: AuthRequest, res: Response) {
  const employer = await Employer.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId },
    { isDeleted: true },
    { new: true },
  );
  if (!employer) return sendError(res, 404, "Employer not found");

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    module: "employers",
    action: "DELETE",
    entityType: "Employer",
    entityId: employer._id,
    entityLabel: employer.companyName,
  });

  return sendSuccess(res, null, "Employer deleted");
}

export async function uploadEmployerAgreement(req: AuthRequest, res: Response) {
  const employer = await Employer.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  if (!employer) return sendError(res, 404, "Employer not found");

  const documentUrl = (req as any).file?.location || "mock_url_until_multer_s3_configured";

  employer.agreements = employer.agreements || [];
  employer.agreements.push({
    documentUrl,
    status: "pending",
  });

  await employer.save();
  return sendSuccess(res, employer, "Agreement uploaded");
}
