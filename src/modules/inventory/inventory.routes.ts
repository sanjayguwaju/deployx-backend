import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { InventoryModule } from "../../models/InventoryItem";
import {
  listItems, createItem, getItem, updateItem, deleteItem,
  listTransactions, createTransaction,
  listDistributions, createDistribution,
  itemValidation, transactionValidation, distributionValidation,
} from "./inventory.controller";

/**
 * Factory that creates an inventory router scoped to a specific department module.
 * Mounted separately for health, education, and agriculture to allow
 * independent CASL subjects per department.
 */
export function createInventoryRouter(
  module: InventoryModule,
  subject: "HealthInventory" | "EducationInventory" | "AgricultureInventory",
): Router {
  const router = Router();
  router.use(authenticate);

  // Attach the module to every request so controllers can read it
  router.use((req: Request, _res: Response, next: NextFunction) => {
    (req as any).inventoryModule = module;
    next();
  });

  // ── Items ──────────────────────────────────────────────────────────────────
  router.get("/items", authorize("read", subject), listItems);
  router.post("/items", authorize("create", subject), itemValidation, validate, createItem);
  router.get("/items/:id", authorize("read", subject), getItem);
  router.put("/items/:id", authorize("update", subject), updateItem);
  router.delete("/items/:id", authorize("delete", subject), deleteItem);

  // ── Transactions ───────────────────────────────────────────────────────────
  router.get("/transactions", authorize("read", subject), listTransactions);
  router.post("/transactions", authorize("create", subject), transactionValidation, validate, createTransaction);

  // ── Distributions ──────────────────────────────────────────────────────────
  router.get("/distributions", authorize("read", subject), listDistributions);
  router.post("/distributions", authorize("create", subject), distributionValidation, validate, createDistribution);

  return router;
}

// Pre-built router instances (imported by app.ts)
export const healthInventoryRouter = createInventoryRouter("health", "HealthInventory");
export const educationInventoryRouter = createInventoryRouter("education", "EducationInventory");
export const agricultureInventoryRouter = createInventoryRouter("agriculture", "AgricultureInventory");
