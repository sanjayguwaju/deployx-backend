import { Response } from "express";
import { AuthRequest } from "../../types";
import { Notification } from "../../models/Notification";
import { sendSuccess, sendPaginated } from "../../utils/response";

export async function listMyNotifications(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");
  const unreadOnly = req.query.unread === "true";

  const filter: Record<string, unknown> = { recipientId: req.user!.id };
  if (unreadOnly) filter.readAt = null;

  const [data, total] = await Promise.all([
    Notification.find(filter).sort("-createdAt").skip((page - 1) * pageSize).limit(pageSize),
    Notification.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function markRead(req: AuthRequest, res: Response) {
  await Notification.updateMany(
    { recipientId: req.user!.id, readAt: null },
    { readAt: new Date() },
  );
  return sendSuccess(res, null, "All notifications marked as read");
}
