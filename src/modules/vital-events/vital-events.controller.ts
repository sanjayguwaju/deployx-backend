import { Request, Response } from "express";
import { AuthRequest } from "../../types";
import { sendSuccess, sendError } from "../../utils/response";
import { VitalEvent } from "../../models/VitalEvent";
import { User } from "../../models/User";

export async function registerEvent(req: AuthRequest, res: Response) {
  try {
    const { eventType, eventDate, eventDateBs, details } = req.body;
    if (!req.user) return sendError(res, 401, "Unauthorized");

    const user = await User.findById(req.user.id);
    if (!user || !user.officeId) return sendError(res, 400, "User must belong to a office");

    const event = await VitalEvent.create({
      tenantId: req.user.tenantId,
      officeId: user.officeId,
      applicantId: user._id,
      eventType,
      eventDate,
      eventDateBs,
      details,
    });

    return sendSuccess(res, event, "Vital event registered successfully", 201);
  } catch (error) {
    return sendError(res, 500, "Error registering vital event");
  }
}

export async function getMyEvents(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, "Unauthorized");
    const events = await VitalEvent.find({ applicantId: req.user.id }).sort({ createdAt: -1 });
    return sendSuccess(res, events);
  } catch (error) {
    return sendError(res, 500, "Error fetching events");
  }
}

export async function getAllEvents(req: AuthRequest, res: Response) {
  try {
    const filter: any = {};
    if (req.user?.officeId) {
      filter.officeId = req.user.officeId; // Office admin only sees their office's events
    }
    const events = await VitalEvent.find(filter).populate("applicantId", "firstName lastName").sort({ createdAt: -1 });
    return sendSuccess(res, events);
  } catch (error) {
    return sendError(res, 500, "Error fetching events");
  }
}

export async function approveEvent(req: AuthRequest, res: Response) {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!req.user) return sendError(res, 401, "Unauthorized");

    const event = await VitalEvent.findById(req.params.id);
    if (!event) return sendError(res, 404, "Event not found");

    event.status = status;
    if (status === "approved") {
      event.approvedBy = req.user.id as any;
      event.certificateNumber = `VE-${Date.now()}`;
    }

    await event.save();
    return sendSuccess(res, event, `Event ${status} successfully`);
  } catch (error) {
    return sendError(res, 500, "Error approving event");
  }
}
