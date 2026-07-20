import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import { School } from "../../models/School";
import { SchoolPerformance } from "../../models/SchoolPerformance";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

export const schoolValidation = [
  body("name").notEmpty().trim(),
  body("officeId").isMongoId(),
  body("level").optional().isIn(["basic", "secondary"]),
];

export const performanceValidation = [
  body("fiscalYear").notEmpty().isString(),
  body("grade").notEmpty().isString(),
  body("totalStudents").isInt({ min: 0 }),
  body("passed").isInt({ min: 0 }),
  body("failed").isInt({ min: 0 }),
];

export async function listSchools(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) ?? "1");
  const pageSize = Math.min(parseInt((req.query.pageSize as string) ?? "20"), 100);
  const filter: Record<string, unknown> = { tenantId: req.user!.tenantId, isDeleted: false };
  if (req.query.officeId) filter.officeId = req.query.officeId;
  if (req.query.level) filter.level = req.query.level;

  const [data, total] = await Promise.all([
    School.find(filter).populate("officeId", "officeNumber").skip((page - 1) * pageSize).limit(pageSize).sort({ name: 1 }),
    School.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function createSchool(req: AuthRequest, res: Response) {
  const school = await School.create({ ...req.body, tenantId: req.user!.tenantId });
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "education", action: "CREATE", entityType: "School", entityId: school._id, entityLabel: school.name, after: school.toObject() });
  return sendSuccess(res, school, "School created", 201);
}

export async function getSchool(req: AuthRequest, res: Response) {
  const school = await School.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false }).populate("officeId", "officeNumber nameNp");
  if (!school) return sendError(res, 404, "School not found");
  return sendSuccess(res, school);
}

export async function updateSchool(req: AuthRequest, res: Response) {
  const before = await School.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  if (!before) return sendError(res, 404, "School not found");
  const school = await School.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "education", action: "UPDATE", entityType: "School", entityId: school!._id, entityLabel: school!.name, before: before.toObject(), after: school!.toObject() });
  return sendSuccess(res, school, "School updated");
}

export async function deleteSchool(req: AuthRequest, res: Response) {
  const school = await School.findOneAndUpdate({ _id: req.params.id, tenantId: req.user!.tenantId }, { isDeleted: true }, { new: true });
  if (!school) return sendError(res, 404, "School not found");
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "education", action: "DELETE", entityType: "School", entityId: school._id, entityLabel: school.name });
  return sendSuccess(res, null, "School deleted");
}

// ─── Performance Records ──────────────────────────────────────────────────────

export async function listSchoolPerformance(req: AuthRequest, res: Response) {
  const school = await School.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  if (!school) return sendError(res, 404, "School not found");
  const records = await SchoolPerformance.find({ schoolId: req.params.id }).sort({ fiscalYear: -1, grade: 1 });
  return sendSuccess(res, records);
}

export async function createSchoolPerformance(req: AuthRequest, res: Response) {
  const school = await School.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  if (!school) return sendError(res, 404, "School not found");
  const record = await SchoolPerformance.create({ ...req.body, schoolId: req.params.id });
  return sendSuccess(res, record, "Performance record added", 201);
}
