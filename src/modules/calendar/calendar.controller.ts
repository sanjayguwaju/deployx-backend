import { Response } from "express";
import { AuthRequest } from "../../types";
import { Demand } from "../../models/Demand";
import { Medical } from "../../models/Medical";
import { Visa } from "../../models/Visa";
import { Ticket } from "../../models/Ticket";
import { Deployment } from "../../models/Deployment";
import { sendSuccess } from "../../utils/response";

export async function getCalendarEvents(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId;
  const events: any[] = [];

  // 1. Demands - interviewDate
  const demands = await Demand.find({ tenantId, isDeleted: false, interviewDate: { $ne: null } })
    .select("trackingNumber profession interviewDate");
  demands.forEach(d => {
    events.push({
      type: "interview",
      date: d.interviewDate,
      title: `Interview: ${d.profession} (${d.trackingNumber})`,
      metadata: { demandId: d._id }
    });
  });

  // 2. Medical - bookedDate & expiryDate
  const medicals = await Medical.find({ tenantId, isDeleted: false })
    .populate("candidateId", "firstName lastName")
    .select("bookedDate expiryDate candidateId");
  medicals.forEach(m => {
    const candidateName = (m.candidateId as any)?.firstName + " " + (m.candidateId as any)?.lastName;
    if (m.bookedDate) {
      events.push({
        type: "medical_booked",
        date: m.bookedDate,
        title: `Medical Appointment: ${candidateName}`,
        metadata: { medicalId: m._id, candidateId: m.candidateId }
      });
    }
    if (m.expiryDate) {
      events.push({
        type: "medical_expiry",
        date: m.expiryDate,
        title: `Medical Expiry: ${candidateName}`,
        metadata: { medicalId: m._id, candidateId: m.candidateId }
      });
    }
  });

  // 3. Visa - expiryDate
  const visas = await Visa.find({ tenantId, isDeleted: false, expiryDate: { $ne: null } })
    .populate("candidateId", "firstName lastName")
    .select("expiryDate candidateId visaNumber");
  visas.forEach(v => {
    const candidateName = (v.candidateId as any)?.firstName + " " + (v.candidateId as any)?.lastName;
    events.push({
      type: "visa_expiry",
      date: v.expiryDate,
      title: `Visa Expiry: ${candidateName} (${v.visaNumber || 'N/A'})`,
      metadata: { visaId: v._id, candidateId: v.candidateId }
    });
  });

  // 4. Ticket - departureDatetime
  const tickets = await Ticket.find({ tenantId, isDeleted: false, departureDatetime: { $ne: null } })
    .populate("candidateId", "firstName lastName")
    .select("departureDatetime candidateId flightNumber");
  tickets.forEach(t => {
    const candidateName = (t.candidateId as any)?.firstName + " " + (t.candidateId as any)?.lastName;
    events.push({
      type: "flight_departure",
      date: t.departureDatetime,
      title: `Flight Departure: ${candidateName} (${t.flightNumber || 'N/A'})`,
      metadata: { ticketId: t._id, candidateId: t.candidateId }
    });
  });

  // 5. Deployment - actualDeploymentDate
  const deployments = await Deployment.find({ tenantId, isDeleted: false, actualDeploymentDate: { $ne: null } })
    .populate("candidateId", "firstName lastName")
    .select("actualDeploymentDate candidateId");
  deployments.forEach(d => {
    const candidateName = (d.candidateId as any)?.firstName + " " + (d.candidateId as any)?.lastName;
    events.push({
      type: "deployment",
      date: d.actualDeploymentDate,
      title: `Deployment: ${candidateName}`,
      metadata: { deploymentId: d._id, candidateId: d.candidateId }
    });
  });

  // Sort events chronologically
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return sendSuccess(res, events);
}
