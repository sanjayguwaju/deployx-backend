import { Response } from "express";
import { AuthRequest } from "../../types";
import { AppDocument } from "../../models/Document";
import { sendSuccess, sendPaginated } from "../../utils/response";

export async function searchDocuments(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");

  const query: any = {
    tenantId: req.user!.tenantId,
  };

  if (req.query.ownerType) query.ownerType = req.query.ownerType;
  if (req.query.ownerId) query.ownerId = req.query.ownerId;
  if (req.query.type) query.documentType = req.query.type;
  if (req.query.tag) query.tags = req.query.tag;

  const [data, total] = await Promise.all([
    AppDocument.find(query)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort("-createdAt"),
    AppDocument.countDocuments(query),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function getDocumentById(req: AuthRequest, res: Response) {
  const doc = await AppDocument.findOne({
    _id: req.params.id,
    tenantId: req.user!.tenantId,
  });
  if (!doc) return res.status(404).json({ message: "Document not found" });
  return sendSuccess(res, doc);
}
