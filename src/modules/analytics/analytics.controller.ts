import { Response } from "express";
import { AuthRequest } from "../../types";
import { Pipeline } from "../../models/Pipeline";
import { Invoice } from "../../models/Invoice";
import { sendSuccess, sendError } from "../../utils/response";

export async function getTrends(req: AuthRequest, res: Response) {
  const mId = req.user!.tenantId;
  const metric = req.query.metric as string;
  const range = (req.query.range as string) || "last_6_months";

  let startDate = new Date();
  if (range === "last_6_months") {
    startDate.setMonth(startDate.getMonth() - 6);
  } else if (range === "last_12_months") {
    startDate.setFullYear(startDate.getFullYear() - 1);
  } else {
    // Default 30 days
    startDate.setDate(startDate.getDate() - 30);
  }

  try {
    let data: any = {};

    switch (metric) {
      case "deployments":
        data = await Pipeline.aggregate([
          { $match: { tenantId: mId, stage: "completed", updatedAt: { $gte: startDate } } },
          { $group: { _id: { $month: "$updatedAt" }, count: { $sum: 1 } } },
          { $sort: { "_id": 1 } }
        ]);
        break;
      
      case "revenue":
        data = await Invoice.aggregate([
          { $match: { tenantId: mId, status: "paid", paidAt: { $gte: startDate } } },
          { $group: { _id: { $month: "$paidAt" }, total: { $sum: "$total" } } },
          { $sort: { "_id": 1 } }
        ]);
        break;

      default:
        return sendError(res, 400, "Invalid metric requested");
    }

    // Basic linear trend delta could be computed here in JS
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load analytics trends", [error.message]);
  }
}
