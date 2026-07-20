import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listLedgerEntries, createLedgerEntry, ledgerValidation } from "./ledger.controller";

const router = Router();
router.use(authenticate);

// Ledger is read + create only — no update or delete (immutable record)
router.get("/", authorize("read", "LedgerEntry"), listLedgerEntries);
router.post("/", authorize("create", "LedgerEntry"), ledgerValidation, validate, createLedgerEntry);

export default router;
