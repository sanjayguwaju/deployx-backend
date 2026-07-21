import { Response } from "express";
import { AuthRequest } from "../../types";
import { Ticket } from "../../models/Ticket";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess } from "../../utils/response";
import { generatePdf } from "../../utils/pdf.service";
import { Tenant } from "../../models/Tenant";
import { Candidate } from "../../models/Candidate";
import { Employer } from "../../models/Employer";
import { Pipeline } from "../../models/Pipeline";
import { Demand } from "../../models/Demand";

export async function getTicketByPipeline(req: AuthRequest, res: Response) {
  const ticket = await Ticket.findOne({
    pipelineId: req.params.pipelineId,
    tenantId: req.user!.tenantId,
    isDeleted: false,
  });
  return sendSuccess(res, ticket || null);
}

export async function createOrUpdateTicket(req: AuthRequest, res: Response) {
  const { pipelineId, candidateId } = req.body;
  let ticket = await Ticket.findOne({ pipelineId, tenantId: req.user!.tenantId, isDeleted: false });

  if (ticket) {
    Object.assign(ticket, req.body);
    await ticket.save();

    await AuditLog.create({
      tenantId: req.user!.tenantId, actorId: req.user!.id,
      module: "ticket", action: "UPDATE", entityType: "Ticket",
      entityId: ticket._id,
    });
  } else {
    ticket = await Ticket.create({
      ...req.body,
      tenantId: req.user!.tenantId,
    });

    await AuditLog.create({
      tenantId: req.user!.tenantId, actorId: req.user!.id,
      module: "ticket", action: "CREATE", entityType: "Ticket",
      entityId: ticket._id,
    });
  }

  return sendSuccess(res, ticket, "Ticket record saved");
}

export async function downloadTicketPdf(req: AuthRequest, res: Response) {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

    const tenant = await Tenant.findById(req.user!.tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: "Tenant not found" });

    let candidate = null;
    let employer = null;

    if (ticket.pipelineId) {
      const pipeline = await Pipeline.findById(ticket.pipelineId);
      if (pipeline) {
        candidate = await Candidate.findById(pipeline.candidateId);
        const demand = await Demand.findById(pipeline.demandId);
        if (demand && demand.employerId) {
           employer = await Employer.findById(demand.employerId);
        }
      }
    } else {
      // Fallback if ticket stores candidateId directly
      candidate = await Candidate.findById(ticket.candidateId);
    }

    if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });

    const pdfBuffer = await generatePdf("flight-ticket", {
      ticket,
      tenant,
      candidate,
      employer
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=ticket-${candidate.firstName}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate Ticket PDF" });
  }
}
