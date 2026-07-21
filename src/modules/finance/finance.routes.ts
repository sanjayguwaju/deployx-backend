import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { 
  getInvoices, 
  createInvoice, 
  markInvoicePaid,
  getExpenses,
  createExpense,
  getCommissions,
  approveCommission,
  markCommissionPaid,
  downloadInvoicePdf
} from "./finance.controller";

const router = Router();
router.use(authenticate);

// Invoices
router.get("/invoices", authorize("read", "Invoice"), getInvoices);
router.post("/invoices", authorize("create", "Invoice"), createInvoice);
router.patch("/invoices/:id/mark-paid", authorize("update", "Invoice"), markInvoicePaid);
router.get("/invoices/:id/pdf", authorize("read", "Invoice"), downloadInvoicePdf);

// Expenses
router.get("/expenses", authorize("read", "Expense"), getExpenses);
router.post("/expenses", authorize("create", "Expense"), createExpense);

// Commissions
router.get("/commissions", authorize("read", "Commission"), getCommissions);
router.post("/commissions/:id/approve", authorize("update", "Commission"), approveCommission);
router.post("/commissions/:id/mark-paid", authorize("update", "Commission"), markCommissionPaid);

export default router;
