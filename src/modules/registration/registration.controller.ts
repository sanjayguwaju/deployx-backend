import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import {
  BirthRegistration, DeathRegistration,
  MarriageRegistration, MigrationRegistration,
} from "../../models/Registration";
import { AuditLog } from "../../models/AuditLog";
import { generateTrackingNumber } from "../../utils/tracking";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

function makeRoutes(Model: any, prefix: string, requiredFields: string[]) {
  return {
    async list(req: AuthRequest, res: Response) {
      const page = parseInt(req.query.page as string ?? "1");
      const pageSize = parseInt(req.query.pageSize as string ?? "20");
      const { status, officeId } = req.query;
      const filter: Record<string, unknown> = { tenantId: req.user!.tenantId };
      if (status) filter.status = status;
      if (officeId) filter.officeId = officeId;
      const [data, total] = await Promise.all([
        Model.find(filter).skip((page - 1) * pageSize).limit(pageSize).sort("-createdAt"),
        Model.countDocuments(filter),
      ]);
      return sendPaginated(res, data, total, page, pageSize);
    },

    async create(req: AuthRequest, res: Response) {
      const registrationNumber = generateTrackingNumber(prefix);
      const reg = await Model.create({
        ...req.body,
        tenantId: req.user!.tenantId,
        registrationNumber,
      });
      await AuditLog.create({
        tenantId: req.user!.tenantId, actorId: req.user!.id,
        module: "registration", action: "CREATE", entityType: prefix,
        entityId: reg._id, entityLabel: registrationNumber,
      });
      return sendSuccess(res, reg, `${prefix} registration created`, 201);
    },

    async getOne(req: AuthRequest, res: Response) {
      const reg = await Model.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
      if (!reg) return sendError(res, 404, "Registration not found");
      return sendSuccess(res, reg);
    },

    async verify(req: AuthRequest, res: Response) {
      const reg = await Model.findByIdAndUpdate(
        req.params.id,
        { status: "verified", verifiedBy: req.user!.id, verifiedAt: new Date() },
        { new: true },
      );
      if (!reg) return sendError(res, 404, "Registration not found");
      return sendSuccess(res, reg, "Registration verified");
    },

    async update(req: AuthRequest, res: Response) {
      const reg = await Model.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.user!.tenantId },
        { $set: req.body },
        { new: true }
      );
      if (!reg) return sendError(res, 404, "Registration not found");
      await AuditLog.create({
        tenantId: req.user!.tenantId, actorId: req.user!.id,
        module: "registration", action: "UPDATE", entityType: prefix,
        entityId: reg._id, entityLabel: reg.registrationNumber || "unknown",
      });
      return sendSuccess(res, reg, `${prefix} registration updated`);
    },

    async delete(req: AuthRequest, res: Response) {
      const reg = await Model.findOneAndDelete({
        _id: req.params.id,
        tenantId: req.user!.tenantId
      });
      if (!reg) return sendError(res, 404, "Registration not found");
      await AuditLog.create({
        tenantId: req.user!.tenantId, actorId: req.user!.id,
        module: "registration", action: "DELETE", entityType: prefix,
        entityId: reg._id, entityLabel: reg.registrationNumber || "unknown",
      });
      return sendSuccess(res, null, `${prefix} registration deleted`);
    },
  };
}

export const birthHandlers = makeRoutes(BirthRegistration, "BR", ["childName", "dateOfBirthBs", "gender"]);
export const deathHandlers = makeRoutes(DeathRegistration, "DR", ["deceasedName", "dateOfDeathBs"]);
export const marriageHandlers = makeRoutes(MarriageRegistration, "MR", ["groomName", "brideName", "marriageDateBs"]);
export const migrationHandlers = makeRoutes(MigrationRegistration, "MG", ["citizenName", "direction", "migrationDateBs"]);
