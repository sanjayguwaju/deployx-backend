import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import { Office } from "../../models/Office";
import { sendSuccess, sendError } from "../../utils/response";

export const wardValidation = [
  body("officeNumber").isInt({ min: 1, max: 50 }),
];

export async function listOffices(req: AuthRequest, res: Response) {
  const offices = await Office.find({ tenantId: req.user!.tenantId, isActive: true }).sort("officeNumber");
  return sendSuccess(res, offices);
}

export async function createOffice(req: AuthRequest, res: Response) {
  const office = await Office.create({ ...req.body, tenantId: req.user!.tenantId });
  return sendSuccess(res, office, "Office created", 201);
}

export async function getOffice(req: AuthRequest, res: Response) {
  const office = await Office.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
  if (!office) return sendError(res, 404, "Office not found");
  return sendSuccess(res, office);
}

export async function updateOffice(req: AuthRequest, res: Response) {
  const office = await Office.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId },
    { $set: req.body }, { new: true },
  );
  if (!office) return sendError(res, 404, "Office not found");
  return sendSuccess(res, office, "Office updated");
}
