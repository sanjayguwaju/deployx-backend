import { Response } from "express";
import { Types } from "mongoose";
import { AuthRequest } from "../../types";
import { Candidate } from "../../models/Candidate";
import { Demand } from "../../models/Demand";
import { Pipeline } from "../../models/Pipeline";
import { Invoice } from "../../models/Invoice";
import { Commission } from "../../models/Commission";
import { Medical } from "../../models/Medical";
import { Visa } from "../../models/Visa";
import { License } from "../../models/License";
import { ComplianceCheck } from "../../models/ComplianceCheck";
import { Employer } from "../../models/Employer";
import { sendSuccess, sendError } from "../../utils/response";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});
redis.on("error", () => {
  /* Ignore connection errors during dev/without redis */
});

async function getCachedData(cacheKey: string, fetcher: () => Promise<any>, ttlSeconds = 60) {
  try {
    if (redis.status === "ready") {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }
    const data = await fetcher();
    if (redis.status === "ready") {
      await redis.setex(cacheKey, ttlSeconds, JSON.stringify(data));
    }
    return data;
  } catch {
    return await fetcher();
  }
}

function mapMonthlyTo12Array(
  aggResults: { _id: number; count?: number; total?: number }[],
  key: "count" | "total" = "count"
): number[] {
  const result = new Array(12).fill(0);
  for (const item of aggResults) {
    if (item._id >= 1 && item._id <= 12) {
      result[item._id - 1] = item[key] || 0;
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. OVERVIEW DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export async function getDashboardOverview(req: AuthRequest, res: Response) {
  const mId = req.user!.tenantId;
  const tenantObjectId = new Types.ObjectId(mId);
  const cacheKey = `dashboard:${mId}:overview`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);

      const [
        totalCandidates,
        activeDemands,
        totalInPipeline,
        completedDeployments,
        pipelineStagesAgg,
        visaStatusAgg,
        revenueAgg,
        invoicedAgg,
        monthlyCandidatesAgg,
        monthlyDeploymentsAgg,
        monthlyRevenueAgg,
      ] = await Promise.all([
        Candidate.countDocuments({ tenantId: tenantObjectId, isDeleted: false }),
        Demand.countDocuments({
          tenantId: tenantObjectId,
          isDeleted: false,
          status: { $in: ["approved", "active", "pending_approval", "draft"] },
        }),
        Pipeline.countDocuments({ tenantId: tenantObjectId, isDeleted: false }),
        Pipeline.countDocuments({ tenantId: tenantObjectId, stage: "completed", isDeleted: false }),
        Pipeline.aggregate([
          { $match: { tenantId: tenantObjectId, isDeleted: false } },
          { $group: { _id: "$stage", count: { $sum: 1 } } },
        ]),
        Visa.aggregate([
          { $match: { tenantId: tenantObjectId, isDeleted: false } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Invoice.aggregate([
          { $match: { tenantId: tenantObjectId, status: "paid" } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Invoice.aggregate([
          { $match: { tenantId: tenantObjectId } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Candidate.aggregate([
          { $match: { tenantId: tenantObjectId, isDeleted: false, createdAt: { $gte: startOfYear } } },
          { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
        ]),
        Pipeline.aggregate([
          { $match: { tenantId: tenantObjectId, stage: "completed", updatedAt: { $gte: startOfYear } } },
          { $group: { _id: { $month: "$updatedAt" }, count: { $sum: 1 } } },
        ]),
        Invoice.aggregate([
          { $match: { tenantId: tenantObjectId, status: "paid", paidAt: { $gte: startOfYear } } },
          { $group: { _id: { $month: "$paidAt" }, total: { $sum: "$total" } } },
        ]),
      ]);

      const stageMap: Record<string, number> = {};
      pipelineStagesAgg.forEach((r: any) => {
        if (r._id) stageMap[r._id] = r.count;
      });

      const visaMap: Record<string, number> = {};
      visaStatusAgg.forEach((r: any) => {
        if (r._id) visaMap[r._id] = r.count;
      });

      const monthlyCandidates = mapMonthlyTo12Array(monthlyCandidatesAgg, "count");
      const monthlyDeployments = mapMonthlyTo12Array(monthlyDeploymentsAgg, "count");
      const monthlyRevenue = mapMonthlyTo12Array(monthlyRevenueAgg, "total");

      const totalRevenue = revenueAgg[0]?.total || 0;
      const totalInvoiced = invoicedAgg[0]?.total || 0;

      return {
        // Modern Manpower Agency Dashboard format
        totalCandidates,
        activeDemands,
        totalInPipeline,
        completedDeployments,
        totalRevenue,
        totalInvoiced,
        pipelineStages: stageMap,
        visaStatuses: visaMap,
        monthlyTrends: {
          candidates: monthlyCandidates,
          deployments: monthlyDeployments,
          revenue: monthlyRevenue,
        },
        // Backwards compatibility mappings for Home.tsx & legacy components
        citizens: { total: totalCandidates },
        serviceRequests: {
          pending: activeDemands,
          byStatus: stageMap,
          monthly: monthlyCandidates,
        },
        complaints: {
          open: 0,
          monthly: monthlyDeployments,
        },
        registrations: {
          totalLast30Days: totalCandidates,
          birthsLast30Days: totalCandidates,
        },
        budget: {
          totalAllocated: totalRevenue,
          totalSpent: totalInvoiced,
        },
        revenue: {
          totalCollected: totalRevenue,
          monthly: monthlyRevenue,
        },
        totalProjects: totalInPipeline,
        infra: {
          byStatus: visaMap,
        },
        generatedAt: new Date().toISOString(),
      };
    });

    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load dashboard overview", [error.message]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DEPLOYMENT PIPELINE DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export async function getPipelineDashboard(req: AuthRequest, res: Response) {
  const mId = req.user!.tenantId;
  const tenantObjectId = new Types.ObjectId(mId);
  const cacheKey = `dashboard:${mId}:pipeline`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const [
        totalInPipeline,
        stagesAgg,
        medicalAgg,
        visaAgg,
        countryAgg,
        recentCandidates,
      ] = await Promise.all([
        Pipeline.countDocuments({ tenantId: tenantObjectId, isDeleted: false }),
        Pipeline.aggregate([
          { $match: { tenantId: tenantObjectId, isDeleted: false } },
          { $group: { _id: "$stage", count: { $sum: 1 } } },
        ]),
        Medical.aggregate([
          { $match: { tenantId: tenantObjectId, isDeleted: false } },
          { $group: { _id: "$result", count: { $sum: 1 } } },
        ]),
        Visa.aggregate([
          { $match: { tenantId: tenantObjectId, isDeleted: false } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Demand.aggregate([
          { $match: { tenantId: tenantObjectId, isDeleted: false } },
          {
            $group: {
              _id: "$country",
              demandsCount: { $sum: 1 },
              quota: { $sum: "$quantityRequired" },
            },
          },
          { $sort: { quota: -1 } },
          { $limit: 8 },
        ]),
        Pipeline.find({ tenantId: tenantObjectId, isDeleted: false })
          .sort({ updatedAt: -1 })
          .limit(8)
          .populate("candidateId", "firstName lastName profession passportNumber phone")
          .populate("demandId", "profession country"),
      ]);

      const stageMap: Record<string, number> = {
        applied: 0,
        shortlisted: 0,
        interview: 0,
        selected: 0,
        medical: 0,
        visa: 0,
        ticket: 0,
        deployment: 0,
        completed: 0,
        rejected: 0,
      };
      stagesAgg.forEach((r: any) => {
        if (r._id) stageMap[r._id] = r.count;
      });

      const medicalMap: Record<string, number> = { passed: 0, pending: 0, failed: 0 };
      medicalAgg.forEach((r: any) => {
        if (r._id) medicalMap[r._id] = r.count;
      });

      const visaMap: Record<string, number> = { applied: 0, in_review: 0, approved: 0, rejected: 0 };
      visaAgg.forEach((r: any) => {
        if (r._id) visaMap[r._id] = r.count;
      });

      return {
        totalInPipeline,
        completedCount: stageMap.completed || 0,
        rejectedCount: stageMap.rejected || 0,
        stages: stageMap,
        medicalStats: medicalMap,
        visaStats: visaMap,
        countryDistribution: countryAgg.map((d: any) => ({
          country: d._id || "Other",
          demands: d.demandsCount,
          quota: d.quota,
        })),
        recentCandidates: recentCandidates.map((p: any) => ({
          id: p._id,
          candidateName: p.candidateId ? `${p.candidateId.firstName} ${p.candidateId.lastName}` : "Unknown",
          profession: p.candidateId?.profession || p.demandId?.profession || "General",
          passport: p.candidateId?.passportNumber || "—",
          destination: p.demandId?.country || "—",
          stage: p.stage,
          updatedAt: p.updatedAt,
        })),
        generatedAt: new Date().toISOString(),
      };
    });

    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load pipeline dashboard", [error.message]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FINANCE & COMMISSIONS DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export async function getFinanceDashboard(req: AuthRequest, res: Response) {
  const mId = req.user!.tenantId;
  const tenantObjectId = new Types.ObjectId(mId);
  const cacheKey = `dashboard:${mId}:finance`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);

      const [
        invoicesStatusAgg,
        commissionsStatusAgg,
        monthlyInvoicedAgg,
        monthlyCollectedAgg,
        topEmployersAgg,
      ] = await Promise.all([
        Invoice.aggregate([
          { $match: { tenantId: tenantObjectId } },
          { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$total" } } },
        ]),
        Commission.aggregate([
          { $match: { tenantId: tenantObjectId } },
          { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } },
        ]),
        Invoice.aggregate([
          { $match: { tenantId: tenantObjectId, createdAt: { $gte: startOfYear } } },
          { $group: { _id: { $month: "$createdAt" }, total: { $sum: "$total" } } },
        ]),
        Invoice.aggregate([
          { $match: { tenantId: tenantObjectId, status: "paid", paidAt: { $gte: startOfYear } } },
          { $group: { _id: { $month: "$paidAt" }, total: { $sum: "$total" } } },
        ]),
        Invoice.aggregate([
          { $match: { tenantId: tenantObjectId, billedToType: "employer" } },
          { $group: { _id: "$billedToId", total: { $sum: "$total" }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
          { $limit: 5 },
        ]),
      ]);

      let totalInvoiced = 0;
      let totalCollected = 0;
      let totalOutstanding = 0;
      const invoiceStatusMap: Record<string, { count: number; total: number }> = {};

      invoicesStatusAgg.forEach((r: any) => {
        totalInvoiced += r.total || 0;
        if (r._id === "paid") {
          totalCollected += r.total || 0;
        } else if (["sent", "overdue", "draft"].includes(r._id)) {
          totalOutstanding += r.total || 0;
        }
        invoiceStatusMap[r._id] = { count: r.count, total: r.total };
      });

      let commissionsPaid = 0;
      let commissionsPending = 0;
      const commissionStatusMap: Record<string, { count: number; total: number }> = {};
      commissionsStatusAgg.forEach((r: any) => {
        if (r._id === "paid") commissionsPaid += r.total || 0;
        else commissionsPending += r.total || 0;
        commissionStatusMap[r._id] = { count: r.count, total: r.total };
      });

      // Populate top employers
      const topEmployersWithNames = await Promise.all(
        topEmployersAgg.map(async (item: any) => {
          const emp = await Employer.findById(item._id).select("companyName country");
          return {
            employerId: item._id,
            companyName: emp?.companyName || "Unknown Employer",
            country: emp?.country || "—",
            total: item.total,
            invoicesCount: item.count,
          };
        })
      );

      return {
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        commissionsPaid,
        commissionsPending,
        invoicesByStatus: invoiceStatusMap,
        commissionsByStatus: commissionStatusMap,
        monthlyInvoiced: mapMonthlyTo12Array(monthlyInvoicedAgg, "total"),
        monthlyCollected: mapMonthlyTo12Array(monthlyCollectedAgg, "total"),
        topEmployers: topEmployersWithNames,
        generatedAt: new Date().toISOString(),
      };
    });

    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load finance dashboard", [error.message]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. COMPLIANCE & DOCUMENTS DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export async function getComplianceDashboard(req: AuthRequest, res: Response) {
  const mId = req.user!.tenantId;
  const tenantObjectId = new Types.ObjectId(mId);
  const cacheKey = `dashboard:${mId}:compliance`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const today = new Date();
      const warningDate = new Date();
      warningDate.setDate(today.getDate() + 30);

      const [
        licenseAgg,
        expiringMedicals,
        expiringVisas,
        expiringLicenses,
        complianceChecksAgg,
      ] = await Promise.all([
        License.aggregate([
          { $match: { tenantId: tenantObjectId } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Medical.find({
          tenantId: tenantObjectId,
          isDeleted: false,
          expiryDate: { $lte: warningDate, $gt: today },
        })
          .populate("candidateId", "firstName lastName passportNumber")
          .limit(6),
        Visa.find({
          tenantId: tenantObjectId,
          isDeleted: false,
          expiryDate: { $lte: warningDate, $gt: today },
        })
          .populate("candidateId", "firstName lastName passportNumber")
          .limit(6),
        License.find({
          tenantId: tenantObjectId,
          expiryDate: { $lte: warningDate, $gt: today },
        }).limit(6),
        ComplianceCheck.aggregate([
          { $match: { tenantId: tenantObjectId } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
      ]);

      const licenseMap: Record<string, number> = { active: 0, expiring: 0, expired: 0 };
      licenseAgg.forEach((r: any) => {
        if (r._id) licenseMap[r._id] = r.count;
      });

      const complianceMap: Record<string, number> = { passed: 0, pending: 0, failed: 0 };
      complianceChecksAgg.forEach((r: any) => {
        if (r._id) complianceMap[r._id] = r.count;
      });

      // Unified expiring list
      const expiringItems: any[] = [];

      for (const lic of expiringLicenses) {
        const daysLeft = Math.ceil((new Date(lic.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        expiringItems.push({
          id: lic._id,
          type: "License",
          title: `${lic.licenseType} (#${lic.licenseNumber})`,
          issuingAuthority: lic.issuingAuthority,
          expiryDate: lic.expiryDate,
          daysLeft,
          urgency: daysLeft <= 7 ? "critical" : "warning",
        });
      }

      for (const med of expiringMedicals) {
        const daysLeft = Math.ceil((new Date(med.expiryDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const cand = med.candidateId as any;
        expiringItems.push({
          id: med._id,
          type: "Medical Certificate",
          title: cand ? `${cand.firstName} ${cand.lastName} (Pass: ${cand.passportNumber || "—"})` : "Candidate Medical",
          issuingAuthority: med.hospitalName || "Medical Center",
          expiryDate: med.expiryDate,
          daysLeft,
          urgency: daysLeft <= 7 ? "critical" : "warning",
        });
      }

      for (const visa of expiringVisas) {
        const daysLeft = Math.ceil((new Date(visa.expiryDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const cand = visa.candidateId as any;
        expiringItems.push({
          id: visa._id,
          type: "Visa",
          title: cand ? `${cand.firstName} ${cand.lastName} (Visa: ${visa.visaNumber || "—"})` : "Candidate Visa",
          issuingAuthority: visa.embassy || visa.sponsorName || "Embassy",
          expiryDate: visa.expiryDate,
          daysLeft,
          urgency: daysLeft <= 7 ? "critical" : "warning",
        });
      }

      // Sort by soonest expiring
      expiringItems.sort((a, b) => a.daysLeft - b.daysLeft);

      return {
        licenseStats: licenseMap,
        upcomingExpiriesCount: {
          medicals: expiringMedicals.length,
          visas: expiringVisas.length,
          licenses: expiringLicenses.length,
        },
        complianceChecks: complianceMap,
        expiringItems,
        generatedAt: new Date().toISOString(),
      };
    });

    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load compliance dashboard", [error.message]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. LEGACY KPIS ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
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
        expiringLicenses,
      ] = await Promise.all([
        Pipeline.aggregate([{ $match: { tenantId: mId } }, { $group: { _id: "$stage", count: { $sum: 1 } } }]),
        Demand.aggregate([{ $match: { tenantId: mId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
        Pipeline.countDocuments({ tenantId: mId, stage: "medical" }),
        Pipeline.countDocuments({ tenantId: mId, stage: "visa" }),
        Invoice.aggregate([
          { $match: { tenantId: mId, status: "paid", paidAt: { $gte: thisMonthStart } } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Invoice.aggregate([
          { $match: { tenantId: mId, status: "paid", paidAt: { $gte: lastMonthStart, $lt: thisMonthStart } } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Commission.aggregate([
          { $match: { tenantId: mId } },
          { $group: { _id: "$status", total: { $sum: "$amount" } } },
        ]),
        Medical.countDocuments({ tenantId: mId, isDeleted: false, expiryDate: { $lte: warningDate, $gt: today } }),
        Visa.countDocuments({ tenantId: mId, isDeleted: false, expiryDate: { $lte: warningDate, $gt: today } }),
        License.countDocuments({ tenantId: mId, status: "active", expiryDate: { $lte: warningDate, $gt: today } }),
      ]);

      const formatAgg = (agg: any[]) => Object.fromEntries(agg.map((r: any) => [r._id, r.count || r.total]));

      return {
        candidatesInPipeline: formatAgg(pipelineStages),
        activeDemands: formatAgg(demandStatuses),
        medicalPending,
        visaProcessing,
        revenue: {
          thisMonth: revenueThisMonth[0]?.total || 0,
          lastMonth: revenueLastMonth[0]?.total || 0,
        },
        commission: formatAgg(commissionSummary),
        upcomingExpiries: {
          medical: expiringMedical,
          visa: expiringVisa,
          licenses: expiringLicenses,
        },
        generatedAt: new Date().toISOString(),
      };
    });
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load dashboard KPIs", [error.message]);
  }
}

