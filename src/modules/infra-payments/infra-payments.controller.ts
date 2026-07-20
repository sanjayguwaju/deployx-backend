import { Request, Response } from "express";
import { AuthRequest } from "../../types";
import { InfraPayment } from "../../models/InfraPayment";
import { InfraProject } from "../../models/InfraProject";
import { BudgetAllocation } from "../../models/BudgetAllocation";
import { LedgerEntry } from "../../models/LedgerEntry";
import { sendSuccess, sendError } from "../../utils/response";
import { createApproval } from "../approvals/approval.service";
import { Types } from "mongoose";

export async function createInfraPayment(req: AuthRequest, res: Response) {
  const { tenantId } = req.user!;
  const { projectId } = req.params;
  const { milestoneId, amountNpr } = req.body;

  try {
    const project = await InfraProject.findOne({ _id: projectId, tenantId });
    if (!project) return sendError(res, 404, "Infrastructure project not found");

    if (project.budgetAllocationId) {
      const budget = await BudgetAllocation.findById(project.budgetAllocationId);
      if (budget) {
        if (budget.spentAmountNpr + amountNpr > budget.allocatedAmountNpr) {
          return sendError(res, 400, "Payment exceeds remaining budget allocation");
        }
      }
    }

    const payment = await InfraPayment.create({
      projectId,
      milestoneId,
      amountNpr,
      status: "pending",
    });

    const approval = await createApproval(
      tenantId,
      "infra_payment",
      "InfraPayment",
      payment._id as Types.ObjectId,
      req.user!.roles.includes("platform_admin") ? 0 : 3, // simplified creator level
      amountNpr
    );

    payment.approvalId = approval._id as Types.ObjectId;
    await payment.save();

    return sendSuccess(res, payment, "Payment requested and sent for approval");
  } catch (error: any) {
    return sendError(res, 500, "Failed to create infra payment", [error.message]);
  }
}

export async function getInfraPayments(req: AuthRequest, res: Response) {
  const { projectId } = req.params;
  try {
    const payments = await InfraPayment.find({ projectId })
      .populate("approvalId", "status currentLevelRequired")
      .populate("milestoneId", "title")
      .sort({ createdAt: -1 });
    return sendSuccess(res, payments);
  } catch (error: any) {
    return sendError(res, 500, "Failed to fetch payments", [error.message]);
  }
}

export async function processPaidPayment(req: AuthRequest, res: Response) {
  const { tenantId } = req.user!;
  const { id } = req.params;
  const { dateBs } = req.body;

  try {
    const payment = await InfraPayment.findById(id).populate("projectId");
    if (!payment) return sendError(res, 404, "Payment not found");

    if (payment.status !== "approved") {
      return sendError(res, 400, "Payment must be approved before it can be paid");
    }

    payment.status = "paid";
    payment.paidAtBs = dateBs;
    await payment.save();

    const project = payment.projectId as any;

    if (project.budgetAllocationId) {
      await BudgetAllocation.findByIdAndUpdate(project.budgetAllocationId, {
        $inc: { spentAmountNpr: payment.amountNpr },
      });
    }

    await LedgerEntry.create({
      tenantId,
      officeId: project.officeId,
      type: "expense",
      amountNpr: payment.amountNpr,
      sourceModule: "infrastructure",
      sourceRecordId: payment._id,
      description: `Infrastructure Payment: ${project.name}`,
      dateBs,
    });

    return sendSuccess(res, payment, "Payment marked as paid and ledger updated");
  } catch (error: any) {
    return sendError(res, 500, "Failed to process payment", [error.message]);
  }
}
