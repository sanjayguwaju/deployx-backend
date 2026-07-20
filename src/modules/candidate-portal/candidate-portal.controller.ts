import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../utils/response";
import { Complaint } from "../../models/Complaint";
import { Demand } from "../../models/Demand";
import { VitalEvent } from "../../models/VitalEvent";

export async function trackStatus(req: Request, res: Response) {
  try {
    const trackingId = req.query.trackingId as string;
    const phone = req.query.phone as string;

    if (!trackingId && !phone) {
      return sendError(res, 400, "Please provide trackingId or phone number");
    }

    // In a multi-tenant system, this would be scoped to req.headers["x-tenant-subdomain"]. 
    // However, the tracking IDs are typically globally unique (ObjectId or formatted string).
    // If searching by phone, it will return their tickets across the system (or filtered if subdomain provided).
    
    let complaints = [];
    let demands = [];
    let vitalEvents = [];

    // Find by trackingId (usually maps to MongoDB _id or specific reference number)
    if (trackingId) {
      if (trackingId.length === 24) { // Valid ObjectId
        const comp = await Complaint.findById(trackingId).select("title status createdAt");
        if (comp) complaints.push(comp);

        const req = await Demand.findById(trackingId).select("title status createdAt");
        if (req) demands.push(req);

        const ve = await VitalEvent.findById(trackingId).select("eventType status createdAt certificateNumber");
        if (ve) vitalEvents.push(ve);
      } else {
        // Search by specific certificate/reference numbers if they exist
        const ve = await VitalEvent.findOne({ certificateNumber: trackingId }).select("eventType status createdAt certificateNumber");
        if (ve) vitalEvents.push(ve);
      }
    }

    // Since the system doesn't directly link Candidate phone to tickets easily yet without complex joins,
    // we return the explicitly found trackingId records for now.

    if (complaints.length === 0 && demands.length === 0 && vitalEvents.length === 0) {
      return sendError(res, 404, "No records found for the given tracking information");
    }

    return sendSuccess(res, {
      complaints,
      demands,
      vitalEvents
    });

  } catch (error) {
    return sendError(res, 500, "Error fetching tracking status");
  }
}
