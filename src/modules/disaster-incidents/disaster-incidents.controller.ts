import { Response } from "express";
import { body } from "express-validator";
import { Types } from "mongoose";
import { AuthRequest } from "../../types";
import { DisasterIncident } from "../../models/DisasterIncident";
import { DamageAssessment } from "../../models/DamageAssessment";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

export const incidentValidation = [
  body("type").notEmpty().trim(),
  body("reportedDateBs").notEmpty().isString(),
  body("severity").isIn(["low", "medium", "high", "critical"]),
  body("location.coordinates").optional().isArray({ min: 2, max: 2 }),
];

export const damageValidation = [
  body("description").notEmpty().trim(),
  body("estimatedLossNpr").optional().isFloat({ min: 0 }),
];

// ─── Incidents ────────────────────────────────────────────────────────────────

export async function listIncidents(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) ?? "1");
  const pageSize = Math.min(parseInt((req.query.pageSize as string) ?? "50"), 200);
  const filter: Record<string, unknown> = { tenantId: req.user!.tenantId, isDeleted: false };
  if (req.query.severity) filter.severity = req.query.severity;
  if (req.query.officeId) filter.officeId = req.query.officeId;

  const [data, total] = await Promise.all([
    DisasterIncident.find(filter).populate("officeId", "officeNumber").populate("reportedBy", "name").skip((page - 1) * pageSize).limit(pageSize).sort({ createdAt: -1 }),
    DisasterIncident.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function createIncident(req: AuthRequest, res: Response) {
  const body = { ...req.body, tenantId: req.user!.tenantId, reportedBy: req.user!.id };
  // Wrap location in GeoJSON if coordinates provided as flat array
  if (req.body.coordinates && Array.isArray(req.body.coordinates)) {
    body.location = { type: "Point", coordinates: req.body.coordinates };
    delete body.coordinates;
  }
  const incident = await DisasterIncident.create(body);
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "disaster_management", action: "CREATE", entityType: "DisasterIncident", entityId: incident._id, entityLabel: `${incident.type} — ${incident.severity}`, after: incident.toObject() });
  return sendSuccess(res, incident, "Incident reported", 201);
}

export async function getIncident(req: AuthRequest, res: Response) {
  const incident = await DisasterIncident.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false }).populate("officeId", "officeNumber").populate("reportedBy", "name email");
  if (!incident) return sendError(res, 404, "Incident not found");
  return sendSuccess(res, incident);
}

export async function updateIncident(req: AuthRequest, res: Response) {
  const before = await DisasterIncident.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  if (!before) return sendError(res, 404, "Incident not found");
  const incident = await DisasterIncident.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "disaster_management", action: "UPDATE", entityType: "DisasterIncident", entityId: incident!._id, entityLabel: `${incident!.type}`, before: before.toObject(), after: incident!.toObject() });
  return sendSuccess(res, incident, "Incident updated");
}

export async function deleteIncident(req: AuthRequest, res: Response) {
  const incident = await DisasterIncident.findOneAndUpdate({ _id: req.params.id, tenantId: req.user!.tenantId }, { isDeleted: true }, { new: true });
  if (!incident) return sendError(res, 404, "Incident not found");
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "disaster_management", action: "DELETE", entityType: "DisasterIncident", entityId: incident._id, entityLabel: incident.type });
  return sendSuccess(res, null, "Incident deleted");
}

// ─── Damage Assessments ───────────────────────────────────────────────────────

export async function listDamageAssessments(req: AuthRequest, res: Response) {
  const incident = await DisasterIncident.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  if (!incident) return sendError(res, 404, "Incident not found");
  const assessments = await DamageAssessment.find({ incidentId: req.params.id }).populate("assessedBy", "name");
  return sendSuccess(res, assessments);
}

export async function createDamageAssessment(req: AuthRequest, res: Response) {
  const incident = await DisasterIncident.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  if (!incident) return sendError(res, 404, "Incident not found");
  const assessment = await DamageAssessment.create({ ...req.body, incidentId: req.params.id, assessedBy: req.user!.id });
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "disaster_management", action: "CREATE", entityType: "DamageAssessment", entityId: assessment._id, entityLabel: assessment.description });
  return sendSuccess(res, assessment, "Assessment recorded", 201);
}
