import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import { InventoryItem, InventoryModule } from "../../models/InventoryItem";
import { InventoryTransaction } from "../../models/InventoryTransaction";
import { Distribution } from "../../models/Distribution";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

// ─── Validation ──────────────────────────────────────────────────────────────

export const itemValidation = [
  body("category").notEmpty().trim(),
  body("name").notEmpty().trim(),
  body("unit").notEmpty().trim(),
];

export const transactionValidation = [
  body("itemId").isMongoId(),
  body("direction").isIn(["in", "out"]),
  body("quantity").isInt({ min: 1 }),
  body("dateBs").notEmpty().isString(),
];

export const distributionValidation = [
  body("transactionId").isMongoId(),
  body("beneficiaryName").notEmpty().trim(),
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Resolves the inventory module from the route-attached context (set by wrapper routes) */
function getModule(req: AuthRequest): InventoryModule {
  return (req as any).inventoryModule as InventoryModule;
}

// ─── Items ────────────────────────────────────────────────────────────────────

export async function listItems(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) ?? "1");
  const pageSize = Math.min(parseInt((req.query.pageSize as string) ?? "20"), 100);
  const { search, category } = req.query;
  const module = getModule(req);

  const filter: Record<string, unknown> = {
    tenantId: req.user!.tenantId,
    module,
    isDeleted: false,
  };
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { nameNp: { $regex: search, $options: "i" } },
    ];
  }

  const [data, total] = await Promise.all([
    InventoryItem.find(filter).skip((page - 1) * pageSize).limit(pageSize).sort({ name: 1 }),
    InventoryItem.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function createItem(req: AuthRequest, res: Response) {
  const module = getModule(req);
  const item = await InventoryItem.create({
    ...req.body,
    module,
    tenantId: req.user!.tenantId,
  });

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    module: `${module}_inventory`,
    action: "CREATE",
    entityType: "InventoryItem",
    entityId: item._id,
    entityLabel: item.name,
    after: item.toObject(),
  });

  return sendSuccess(res, item, "Item created", 201);
}

export async function getItem(req: AuthRequest, res: Response) {
  const module = getModule(req);
  const item = await InventoryItem.findOne({
    _id: req.params.id,
    tenantId: req.user!.tenantId,
    module,
    isDeleted: false,
  });
  if (!item) return sendError(res, 404, "Item not found");
  return sendSuccess(res, item);
}

export async function updateItem(req: AuthRequest, res: Response) {
  const module = getModule(req);
  const item = await InventoryItem.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, module, isDeleted: false },
    { $set: req.body },
    { new: true },
  );
  if (!item) return sendError(res, 404, "Item not found");
  return sendSuccess(res, item, "Item updated");
}

export async function deleteItem(req: AuthRequest, res: Response) {
  const module = getModule(req);
  const item = await InventoryItem.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, module },
    { isDeleted: true },
    { new: true },
  );
  if (!item) return sendError(res, 404, "Item not found");
  return sendSuccess(res, null, "Item deleted");
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function listTransactions(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) ?? "1");
  const pageSize = Math.min(parseInt((req.query.pageSize as string) ?? "20"), 100);
  const { itemId, direction } = req.query;

  const filter: Record<string, unknown> = {
    tenantId: req.user!.tenantId,
  };
  if (itemId) filter.itemId = itemId;
  if (direction) filter.direction = direction;

  const [data, total] = await Promise.all([
    InventoryTransaction.find(filter)
      .populate("itemId", "name nameNp unit")
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 }),
    InventoryTransaction.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function createTransaction(req: AuthRequest, res: Response) {
  // Verify item belongs to this tenant and module
  const module = getModule(req);
  const item = await InventoryItem.findOne({
    _id: req.body.itemId,
    tenantId: req.user!.tenantId,
    module,
    isDeleted: false,
  });
  if (!item) return sendError(res, 404, "Inventory item not found");

  const tx = await InventoryTransaction.create({
    ...req.body,
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
  });

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    module: `${module}_inventory`,
    action: `STOCK_${(req.body.direction as string).toUpperCase()}`,
    entityType: "InventoryTransaction",
    entityId: tx._id,
    entityLabel: `${item.name} — qty ${req.body.quantity}`,
    after: tx.toObject(),
  });

  return sendSuccess(res, tx, "Transaction recorded", 201);
}

// ─── Distributions ────────────────────────────────────────────────────────────

export async function listDistributions(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) ?? "1");
  const pageSize = Math.min(parseInt((req.query.pageSize as string) ?? "20"), 100);

  const [data, total] = await Promise.all([
    Distribution.find({ tenantId: req.user!.tenantId })
      .populate({ path: "transactionId", populate: { path: "itemId", select: "name unit" } })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 }),
    Distribution.countDocuments({ tenantId: req.user!.tenantId }),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function createDistribution(req: AuthRequest, res: Response) {
  const dist = await Distribution.create({
    ...req.body,
    tenantId: req.user!.tenantId,
  });
  return sendSuccess(res, dist, "Distribution recorded", 201);
}
