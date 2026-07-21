import { Response } from "express";
import { AuthRequest } from "../../types";
import { Invoice } from "../../models/Invoice";
import { Expense } from "../../models/Expense";
import { Commission } from "../../models/Commission";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import { generatePdf } from "../../utils/pdf.service";
import { Tenant } from "../../models/Tenant";
import { Candidate } from "../../models/Candidate";

export async function getInvoices(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");

  const query: any = { tenantId: req.user!.tenantId };
  if (req.query.billedToType) query.billedToType = req.query.billedToType;
  if (req.query.status) query.status = req.query.status;

  const [data, total] = await Promise.all([
    Invoice.find(query).skip((page - 1) * pageSize).limit(pageSize).sort("-createdAt"),
    Invoice.countDocuments(query),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function createInvoice(req: AuthRequest, res: Response) {
  const invoice = await Invoice.create({
    ...req.body,
    tenantId: req.user!.tenantId,
    status: "draft"
  });

  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "finance", action: "CREATE", entityType: "Invoice", entityId: invoice._id
  });

  return sendSuccess(res, invoice, "Invoice created successfully", 201);
}

export async function markInvoicePaid(req: AuthRequest, res: Response) {
  const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
  if (!invoice) return sendError(res, 404, "Invoice not found");

  invoice.status = "paid";
  invoice.paidAt = new Date();
  invoice.paymentMethod = req.body.paymentMethod || "Bank Transfer";
  await invoice.save();

  return sendSuccess(res, invoice, "Invoice marked as paid");
}

export async function downloadInvoicePdf(req: AuthRequest, res: Response) {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    const tenant = await Tenant.findById(req.user!.tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: "Tenant not found" });

    // Assuming we want to fetch the candidate if billed to candidate, or employer if billed to employer
    let client = { name: "Client", address: "", email: "" };
    let candidate = null;

    if (invoice.billedToType === "candidate") {
      candidate = await Candidate.findById(invoice.billedToId);
      if (candidate) {
        client = {
          name: `${candidate.firstName} ${candidate.lastName}`,
          address: candidate.permanentAddress || "",
          email: candidate.email || ""
        };
      }
    }
    // If it's employer, we would fetch employer. Stubbing for now.

    const pdfBuffer = await generatePdf("invoice", {
      invoice,
      tenant,
      client,
      candidate
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate PDF" });
  }
}

export async function getExpenses(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");

  const [data, total] = await Promise.all([
    Expense.find({ tenantId: req.user!.tenantId })
      .skip((page - 1) * pageSize).limit(pageSize).sort("-incurredAt"),
    Expense.countDocuments({ tenantId: req.user!.tenantId }),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function createExpense(req: AuthRequest, res: Response) {
  const expense = await Expense.create({
    ...req.body,
    tenantId: req.user!.tenantId,
    recordedBy: req.user!.id
  });

  return sendSuccess(res, expense, "Expense recorded successfully", 201);
}

export async function getCommissions(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");

  const query: any = { tenantId: req.user!.tenantId };
  if (req.query.agentId) query.agentId = req.query.agentId;
  if (req.query.status) query.status = req.query.status;

  const [data, total] = await Promise.all([
    Commission.find(query).skip((page - 1) * pageSize).limit(pageSize).sort("-createdAt"),
    Commission.countDocuments(query),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function approveCommission(req: AuthRequest, res: Response) {
  const commission = await Commission.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
  if (!commission) return sendError(res, 404, "Commission not found");

  commission.status = "approved";
  commission.approvedBy = req.user!.id as any;
  await commission.save();

  return sendSuccess(res, commission, "Commission approved");
}

export async function markCommissionPaid(req: AuthRequest, res: Response) {
  const commission = await Commission.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
  if (!commission) return sendError(res, 404, "Commission not found");

  commission.status = "paid";
  commission.paidAt = new Date();
  await commission.save();

  return sendSuccess(res, commission, "Commission marked as paid");
}
