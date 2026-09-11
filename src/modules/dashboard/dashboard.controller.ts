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
import { Contract } from "../../models/Contract";
import { ComplianceCheck } from "../../models/ComplianceCheck";
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

// ─── Overview Dashboard ───────────────────────────────────────────────────────
export async function getDashboardOverview(req: AuthRequest, res: Response) {
  const mId = req.user!.tenantId;
  const cacheKey = `dashboard:${mId}:overview`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const today = new Date();
      const months = Array.from({ length: 12 }, (_, i) => new Date(today.getFullYear(), i, 1));

      const [totalCandidates, demandStatuses, pipelineStages, invoicePaid, invoiceUnpaid, monthlyDemandsRaw, monthlyPipelineRaw] =
        await Promise.all([
          Candidate.countDocuments({ tenantId: mId, isDeleted: false }),
          Demand.aggregate([{ $match: { tenantId: mId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
          Pipeline.aggregate([{ $match: { tenantId: mId } }, { $group: { _id: "$stage", count: { $sum: 1 } } }]),
          Invoice.aggregate([{ $match: { tenantId: mId, status: "paid" } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
          Invoice.aggregate([{ $match: { tenantId: mId, status: { $ne: "paid" } } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
          Demand.aggregate([
            { $match: { tenantId: mId } },
            { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
          ]),
          Pipeline.aggregate([
            { $match: { tenantId: mId } },
            { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
          ]),
        ]);

      const toMonthly = (raw: any[]) => months.map((_, i) => raw.find((r) => r._id === i + 1)?.count || 0);
      const byStatus = Object.fromEntries(demandStatuses.map((d: any) => [d._id, d.count]));
      const byStage = Object.fromEntries(pipelineStages.map((d: any) => [d._id, d.count]));
      const pendingDemands = demandStatuses.find((d: any) => d._id === "open")?.count || 0;
      const totalPipeline = pipelineStages.reduce((s: number, d: any) => s + d.count, 0);

      return {
        citizens: { total: totalCandidates },
        serviceRequests: { pending: pendingDemands, byStatus, monthly: toMonthly(monthlyDemandsRaw) },
        complaints: { open: 0, monthly: toMonthly(monthlyPipelineRaw) },
        registrations: { totalLast30Days: 0 },
        budget: { totalAllocated: invoicePaid[0]?.total || 0, totalSpent: invoiceUnpaid[0]?.total || 0 },
        revenue: { totalCollected: invoicePaid[0]?.total || 0, monthly: Array(12).fill(0) },
        totalProjects: totalPipeline,
        infra: { byStatus: byStage },
      };
    });
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load overview dashboard", [error.message]);
  }
}

// ─── Pipeline Dashboard ───────────────────────────────────────────────────────
export async function getDashboardPipeline(req: AuthRequest, res: Response) {
  const mId = req.user!.tenantId;
  const cacheKey = `dashboard:${mId}:pipeline`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const [byStage, byDemand, medicalPending, visaProcessing, totalActive] = await Promise.all([
        Pipeline.aggregate([{ $match: { tenantId: mId } }, { $group: { _id: "$stage", count: { $sum: 1 } } }]),
        Demand.aggregate([{ $match: { tenantId: mId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
        Pipeline.countDocuments({ tenantId: mId, stage: "medical" }),
        Pipeline.countDocuments({ tenantId: mId, stage: "visa" }),
        Pipeline.countDocuments({ tenantId: mId }),
      ]);

      return {
        byStage: Object.fromEntries(byStage.map((d: any) => [d._id, d.count])),
        byDemandStatus: Object.fromEntries(byDemand.map((d: any) => [d._id, d.count])),
        medicalPending,
        visaProcessing,
        totalActive,
      };
    });
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load pipeline dashboard", [error.message]);
  }
}

// ─── Finance Dashboard ────────────────────────────────────────────────────────
export async function getDashboardFinance(req: AuthRequest, res: Response) {
  const mId = req.user!.tenantId;
  const cacheKey = `dashboard:${mId}:finance`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const [invoiceByStatus, commissionByStatus, recentInvoices] = await Promise.all([
        Invoice.aggregate([
          { $match: { tenantId: mId } },
          { $group: { _id: "$status", total: { $sum: "$total" }, count: { $sum: 1 } } },
        ]),
        Commission.aggregate([
          { $match: { tenantId: mId } },
          { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
        Invoice.find({ tenantId: mId }).sort({ createdAt: -1 }).limit(10).select("invoiceNumber total status dueDate"),
      ]);

      const budgetBySection = invoiceByStatus.map((r: any) => ({ _id: r._id, allocated: r.total, spent: r.count }));
      const revenueByType = commissionByStatus.map((r: any) => ({ _id: r._id, total: r.total }));

      return { budgetBySection, revenueByType, recentInvoices };
    });
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load finance dashboard", [error.message]);
  }
}

// ─── Compliance Dashboard ─────────────────────────────────────────────────────
export async function getDashboardCompliance(req: AuthRequest, res: Response) {
  const mId = req.user!.tenantId;
  const cacheKey = `dashboard:${mId}:compliance`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const today = new Date();
      const warningDate = new Date();
      warningDate.setDate(today.getDate() + 30);

      const [contractsByStatus, complianceChecks, expiringMedical, expiringVisa, expiringLicenses] = await Promise.all([
        Contract.aggregate([{ $match: { tenantId: mId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
        ComplianceCheck.aggregate([{ $match: { tenantId: mId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
        Medical.countDocuments({ tenantId: mId, isDeleted: false, expiryDate: { $lte: warningDate, $gt: today } }),
        Visa.countDocuments({ tenantId: mId, isDeleted: false, expiryDate: { $lte: warningDate, $gt: today } }),
        License.countDocuments({ tenantId: mId, status: "active", expiryDate: { $lte: warningDate, $gt: today } }),
      ]);

      return {
        contractsByStatus: Object.fromEntries(contractsByStatus.map((d: any) => [d._id, d.count])),
        complianceChecks: Object.fromEntries(complianceChecks.map((d: any) => [d._id, d.count])),
        upcomingExpiries: { medical: expiringMedical, visa: expiringVisa, licenses: expiringLicenses },
      };
    });
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load compliance dashboard", [error.message]);
  }
}
