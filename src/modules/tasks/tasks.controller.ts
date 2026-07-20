import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import { Task } from "../../models/Task";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

export const taskValidation = [
  body("title").notEmpty().trim(),
  body("assignedTo").isMongoId(),
  body("category").isIn(["passport_verification", "medical", "embassy", "accounts", "hr", "operations"]),
];

export async function listTasks(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");
  const { status, category, assignedTo } = req.query;

  const filter: Record<string, unknown> = {
    tenantId: req.user!.tenantId,
    isDeleted: false,
  };
  
  if (status) filter.status = status;
  if (category) filter.category = category;
  
  // By default, let people see their own tasks unless they filter otherwise (or we can just show all if permitted)
  if (assignedTo) {
    filter.assignedTo = assignedTo;
  } else if (!req.user!.roles.includes("tenant_admin") && !req.user!.roles.includes("hr")) {
    filter.assignedTo = req.user!.id;
  }

  const [data, total] = await Promise.all([
    Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("pipelineId")
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort("dueDate"),
    Task.countDocuments(filter),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function createTask(req: AuthRequest, res: Response) {
  const task = await Task.create({
    ...req.body,
    tenantId: req.user!.tenantId,
  });

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    module: "tasks", action: "CREATE", entityType: "Task",
    entityId: task._id, entityLabel: task.title,
  });

  return sendSuccess(res, task, "Task created", 201);
}

export async function getTask(req: AuthRequest, res: Response) {
  const task = await Task.findOne({
    _id: req.params.id,
    tenantId: req.user!.tenantId,
    isDeleted: false,
  }).populate("assignedTo", "name email").populate("pipelineId");
  
  if (!task) return sendError(res, 404, "Task not found");
  return sendSuccess(res, task);
}

export async function updateTask(req: AuthRequest, res: Response) {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { $set: req.body }, { new: true }
  );
  if (!task) return sendError(res, 404, "Task not found");
  
  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "tasks", action: "UPDATE", entityType: "Task",
    entityId: task._id, entityLabel: task.title,
  });
  
  return sendSuccess(res, task, "Task updated");
}

export async function deleteTask(req: AuthRequest, res: Response) {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { isDeleted: true }, { new: true }
  );
  if (!task) return sendError(res, 404, "Task not found");
  
  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "tasks", action: "DELETE", entityType: "Task",
    entityId: task._id, entityLabel: task.title,
  });
  
  return sendSuccess(res, null, "Task deleted");
}

export async function markTaskDone(req: AuthRequest, res: Response) {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { status: "done" }, { new: true }
  );
  if (!task) return sendError(res, 404, "Task not found");
  
  return sendSuccess(res, task, "Task marked as done");
}
