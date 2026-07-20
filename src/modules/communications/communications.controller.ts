import { Response } from "express";
import { AuthRequest } from "../../types";
import { Notification } from "../../models/Notification";
import { CommunicationTemplate } from "../../models/CommunicationTemplate";
import { Candidate } from "../../models/Candidate";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
// import notificationQueue from "../../workers/notification.worker"; // Existing or to be built

export async function dispatchNotification(req: AuthRequest, res: Response) {
  const { recipientId, recipientPhone, recipientEmail, channel, templateId, subject, body, entityType, entityId } = req.body;

  const notification = await Notification.create({
    tenantId: req.user!.tenantId,
    recipientId,
    recipientPhone,
    recipientEmail,
    channel,
    templateId,
    subject,
    body,
    entityType,
    entityId,
    status: "pending"
  });

  // Enqueue to bull worker here:
  // notificationQueue.add("send", { notificationId: notification._id });

  return sendSuccess(res, notification, "Notification queued for dispatch", 201);
}

export async function getTemplates(req: AuthRequest, res: Response) {
  const templates = await CommunicationTemplate.find({ tenantId: req.user!.tenantId, isActive: true });
  return sendSuccess(res, templates);
}

export async function bulkSend(req: AuthRequest, res: Response) {
  const { candidateIds, templateId } = req.body;
  
  const template = await CommunicationTemplate.findOne({ _id: templateId, tenantId: req.user!.tenantId });
  if (!template) return sendError(res, 404, "Template not found");

  const candidates = await Candidate.find({
    _id: { $in: candidateIds },
    tenantId: req.user!.tenantId
  });

  const dispatches = candidates.map(c => ({
    tenantId: req.user!.tenantId,
    recipientId: c._id,
    recipientPhone: c.phone || c.whatsapp,
    recipientEmail: c.email,
    channel: template.channel,
    templateId: template._id,
    subject: template.subject,
    body: template.body, // In real logic, run mustache(template.body, c)
    status: "pending"
  }));

  const created = await Notification.insertMany(dispatches);
  
  // Here we would enqueue `created` to the Bull worker

  return sendSuccess(res, created, `Enqueued ${created.length} messages`);
}

export async function getTimeline(req: AuthRequest, res: Response) {
  const { entityType, entityId } = req.params;
  
  // To get unified timeline for candidate:
  // We match Notifications where recipientId = entityId OR entityId = entityId (depending on how it was logged)
  const timeline = await Notification.find({
    tenantId: req.user!.tenantId,
    $or: [
      { recipientId: entityId },
      { entityId: entityId, entityType: entityType }
    ]
  }).sort("-createdAt");

  return sendSuccess(res, timeline);
}
