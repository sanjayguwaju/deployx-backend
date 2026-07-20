import { Response } from "express";
import { AuthRequest } from "../../types";
import { Candidate } from "../../models/Candidate";
import { Demand } from "../../models/Demand";
import { Pipeline } from "../../models/Pipeline";
import { Invoice } from "../../models/Invoice";
import { Commission } from "../../models/Commission";
import { Medical } from "../../models/Medical";
import { Visa } from "../../models/Visa";
import { License } from "../../models/License";
import { sendSuccess, sendError } from "../../utils/response";
import Redis from "ioredis";

// Reuse the redis caching logic from base Palika OS
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
redis.on('error', () => { /* Ignore connection errors during local dev */ });

async function getCachedData(cacheKey: string, fetcher: () => Promise<any>, ttlSeconds = 300) {
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    const data = await fetcher();
    await redis.setex(cacheKey, ttlSeconds, JSON.stringify(data));
    return data;
  } catch (error) {
    return await fetcher();
  }
}

export async function getDashboardKpis(req: AuthRequest, res: Response) {
  const mId = req.user!.tenantId;
  const cacheKey = `dashboard:${mId}:kpis`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const today = new Date();
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const warningDate = new Date();
      warningDate.setDate(today.getDate() + 30);

      // Aggregations
      const [
        pipelineStages,
        demandStatuses,
        medicalPending,
        visaProcessing,
        revenueThisMonth,
        revenueLastMonth,
        commissionSummary,
        expiringMedical,
        expiringVisa,
        expiringLicenses
      ] = await Promise.all([
        Pipeline.aggregate([{ $match: { tenantId: mId } }, { $group: { _id: "$stage", count: { $sum: 1 } } }]),
        Demand.aggregate([{ $match: { tenantId: mId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
        Pipeline.countDocuments({ tenantId: mId, stage: "medical" }),
        Pipeline.countDocuments({ tenantId: mId, stage: "visa" }),
        Invoice.aggregate([
          { $match: { tenantId: mId, status: "paid", paidAt: { $gte: thisMonthStart } } },
          { $group: { _id: null, total: { $sum: "$total" } } }
        ]),
        Invoice.aggregate([
          { $match: { tenantId: mId, status: "paid", paidAt: { $gte: lastMonthStart, $lt: thisMonthStart } } },
          { $group: { _id: null, total: { $sum: "$total" } } }
        ]),
        Commission.aggregate([
          { $match: { tenantId: mId } },
          { $group: { _id: "$status", total: { $sum: "$amount" } } }
        ]),
        Medical.countDocuments({ tenantId: mId, isDeleted: false, expiryDate: { $lte: warningDate, $gt: today } }),
        Visa.countDocuments({ tenantId: mId, isDeleted: false, expiryDate: { $lte: warningDate, $gt: today } }),
        License.countDocuments({ tenantId: mId, status: "active", expiryDate: { $lte: warningDate, $gt: today } })
      ]);

      const formatAgg = (agg: any[]) => Object.fromEntries(agg.map((r: any) => [r._id, r.count || r.total]));

      return {
        candidatesInPipeline: formatAgg(pipelineStages),
        activeDemands: formatAgg(demandStatuses),
        medicalPending,
        visaProcessing,
        revenue: {
          thisMonth: revenueThisMonth[0]?.total || 0,
          lastMonth: revenueLastMonth[0]?.total || 0
        },
        commission: formatAgg(commissionSummary),
        upcomingExpiries: {
          medical: expiringMedical,
          visa: expiringVisa,
          licenses: expiringLicenses
        },
        generatedAt: new Date().toISOString(),
      };
    });
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load dashboard KPIs", [error.message]);
  }
}
