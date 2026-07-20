import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../../types";
import { ReportDefinition } from "../../models/ReportDefinition";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

// Dynamically grab Mongoose models for the query builder
const getModel = (modelName: string) => mongoose.model(modelName);

export async function listReports(req: AuthRequest, res: Response) {
  const reports = await ReportDefinition.find({ tenantId: req.user!.tenantId }).sort("category name");
  return sendSuccess(res, reports);
}

export async function runReport(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { filters = {}, page = 1, pageSize = 50 } = req.body;

  const definition = await ReportDefinition.findOne({ _id: id, tenantId: req.user!.tenantId });
  if (!definition) return sendError(res, 404, "Report definition not found");

  const Model = getModel(definition.baseEntity);
  if (!Model) return sendError(res, 500, "Base entity model not registered in system");

  // Base query scoping
  const query: any = { tenantId: req.user!.tenantId };

  // Naive filter mapping (in a real app, map operatorOptions like 'gt' to '$gt')
  Object.keys(filters).forEach(key => {
    query[key] = filters[key];
  });

  // Projection based on columns
  const projection: any = {};
  definition.columns.forEach(col => {
    projection[col.field] = 1;
  });
  
  // Always include timestamps if needed, or _id
  projection._id = 1;

  const [data, total] = await Promise.all([
    Model.find(query)
      .select(projection)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort(definition.defaultSort || "-createdAt"),
    Model.countDocuments(query)
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function exportReport(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { filters = {}, format = "csv" } = req.body;

  const definition = await ReportDefinition.findOne({ _id: id, tenantId: req.user!.tenantId });
  if (!definition) return sendError(res, 404, "Report definition not found");

  const Model = getModel(definition.baseEntity);
  
  const query: any = { tenantId: req.user!.tenantId };
  Object.keys(filters).forEach(key => {
    query[key] = filters[key];
  });

  const projection: any = {};
  definition.columns.forEach(col => {
    projection[col.field] = 1;
  });

  // Export fetches all data without pagination (beware of huge datasets in prod)
  const data = await Model.find(query).select(projection).sort(definition.defaultSort || "-createdAt");

  if (format === "csv") {
    // Basic CSV generation
    const headers = definition.columns.map(c => c.label).join(",");
    const rows = data.map(row => {
      return definition.columns.map(c => {
        const val = (row as any)[c.field];
        return val ? `"${String(val).replace(/"/g, '""')}"` : "";
      }).join(",");
    });
    
    const csvContent = [headers, ...rows].join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=report_${id}.csv`);
    return res.send(csvContent);
  }

  // Fallback for PDF / Excel
  return sendSuccess(res, { message: `Export to ${format} is simulated. Data attached.`, data });
}
