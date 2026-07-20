import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import { LedgerEntry } from "../../models/LedgerEntry";
import { sendSuccess, sendPaginated } from "../../utils/response";

export const ledgerValidation = [
  body("type").isIn(["income", "expense"]),
  body("amountNpr").isFloat({ min: 0 }),
  body("description").notEmpty().trim(),
  body("dateBs").notEmpty().isString(),
];

export async function listLedgerEntries(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) ?? "1");
  const pageSize = Math.min(parseInt((req.query.pageSize as string) ?? "20"), 100);
  const filter: Record<string, unknown> = { tenantId: req.user!.tenantId };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.sourceModule) filter.sourceModule = req.query.sourceModule;
  if (req.query.officeId) filter.officeId = req.query.officeId;

  const [data, total] = await Promise.all([
    LedgerEntry.find(filter).populate("officeId", "officeNumber").skip((page - 1) * pageSize).limit(pageSize).sort({ dateBs: -1 }),
    LedgerEntry.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function createLedgerEntry(req: AuthRequest, res: Response) {
  // Ledger is append-only — no updates or deletes (matches AuditLog immutability pattern)
  const entry = await LedgerEntry.create({
    ...req.body,
    tenantId: req.user!.tenantId,
  });
  return sendSuccess(res, entry, "Ledger entry recorded", 201);
}
