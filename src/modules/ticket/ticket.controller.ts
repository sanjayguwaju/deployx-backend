import { Response } from "express";
import { AuthRequest } from "../../types";
import { Ticket } from "../../models/Ticket";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess } from "../../utils/response";

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
