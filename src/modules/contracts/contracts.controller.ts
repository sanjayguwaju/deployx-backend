import { Response } from "express";
import { AuthRequest } from "../../types";
import { ContractTemplate } from "../../models/ContractTemplate";
import { Contract } from "../../models/Contract";
import { Candidate } from "../../models/Candidate";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess, sendError } from "../../utils/response";
import { Request } from "express";
import { generatePdf } from "../../utils/pdf.service";
import { Tenant } from "../../models/Tenant";

import { Demand } from "../../models/Demand";

export async function getContracts(req: AuthRequest, res: Response) {
  const contracts = await Contract.find({ tenantId: req.user!.tenantId })
    .populate("candidateId", "firstName lastName passportNumber phone")
    .populate("employerId", "companyName country")
    .populate("demandId", "trackingNumber profession country")
    .populate("templateId", "name type")
    .sort({ createdAt: -1 });

  return sendSuccess(res, contracts);
}

export async function getTemplates(req: AuthRequest, res: Response) {
  const templates = await ContractTemplate.find({ tenantId: req.user!.tenantId });
  return sendSuccess(res, templates);
}

export async function generateContract(req: AuthRequest, res: Response) {
  const { templateId, candidateId, demandId, employerId } = req.body;

  const template = await ContractTemplate.findOne({ _id: templateId, tenantId: req.user!.tenantId });
  if (!template) return sendError(res, 404, "Template not found");

  let resolvedEmployerId = employerId;
  if (!resolvedEmployerId && demandId) {
    const demand = await Demand.findById(demandId);
    if (demand) resolvedEmployerId = demand.employerId;
  }

  const mockPdfUrl = `/api/v1/contracts/mock.pdf`;

  const contract = await Contract.create({
    tenantId: req.user!.tenantId,
    templateId,
    candidateId,
    employerId: resolvedEmployerId,
    demandId,
    pdfUrl: mockPdfUrl,
    signatureStatus: "draft",
    signatures: []
  });

  const populated = await Contract.findById(contract._id)
    .populate("candidateId", "firstName lastName passportNumber phone")
    .populate("employerId", "companyName country")
    .populate("demandId", "trackingNumber profession country")
    .populate("templateId", "name type");

  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "contracts", action: "CREATE", entityType: "Contract", entityId: contract._id
  });

  return sendSuccess(res, populated || contract, "Contract generated successfully", 201);
}

export async function deleteContract(req: AuthRequest, res: Response) {
  const contract = await Contract.findOneAndDelete({ _id: req.params.id, tenantId: req.user!.tenantId });
  if (!contract) return sendError(res, 404, "Contract not found");

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    module: "contracts",
    action: "DELETE",
    entityType: "Contract",
    entityId: contract._id,
  });

  return sendSuccess(res, null, "Contract deleted successfully");
}

export async function sendContract(req: AuthRequest, res: Response) {
  const contract = await Contract.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
  if (!contract) return sendError(res, 404, "Contract not found");

  contract.signatureStatus = "sent";
  await contract.save();

  // Here we would dispatch to `communications` to email the PDF to Candidate/Employer.

  return sendSuccess(res, contract, "Contract sent for signature");
}

export async function signContract(req: AuthRequest, res: Response) {
  const { signerType, signatureUrl } = req.body; // In portal, candidate/employer pushes their signature pad output here
  
  const contract = await Contract.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
  if (!contract) return sendError(res, 404, "Contract not found");

  const signerId = req.user!.candidateId || req.user!.employerId || req.user!.id; // Depending on role

  contract.signatures.push({
    signerType,
    signerId: signerId as any,
    signatureUrl,
    signedAt: new Date(),
    ipAddress: req.ip
  });

  // Calculate overall status
  const hasCandidate = contract.signatures.some(s => s.signerType === "candidate");
  const hasEmployer = contract.signatures.some(s => s.signerType === "employer");

  if (hasCandidate && hasEmployer) {
    contract.signatureStatus = "fully_signed";
  } else if (hasCandidate) {
    contract.signatureStatus = "signed_candidate";
  } else if (hasEmployer) {
    contract.signatureStatus = "signed_employer";
  }

  await contract.save();
  return sendSuccess(res, contract, `Contract signed by ${signerType}`);
}

export async function getContractStatus(req: AuthRequest, res: Response) {
  const contract = await Contract.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
  if (!contract) return sendError(res, 404, "Contract not found");
  return sendSuccess(res, contract);
}

// Phase 13: Public Document Signing
export async function getPublicContract(req: Request, res: Response) {
  // In a real app, verify a hash/token instead of just ID
  const contract = await Contract.findById(req.params.id)
    .populate("candidateId", "firstName lastName passportNumber")
    .populate("employerId", "companyName");
    
  if (!contract) return sendError(res, 404, "Contract not found");
  
  return sendSuccess(res, {
    _id: contract._id,
    signatureStatus: contract.signatureStatus,
    pdfUrl: contract.pdfUrl,
    candidate: contract.candidateId,
    employer: contract.employerId,
    signatures: contract.signatures
  });
}

export async function signPublicContract(req: Request, res: Response) {
  const { signatureUrl, signerType } = req.body;
  if (!signatureUrl) return sendError(res, 400, "Signature Base64 is required");

  const contract = await Contract.findById(req.params.id);
  if (!contract) return sendError(res, 404, "Contract not found");

  contract.signatures.push({
    signerType: signerType || "candidate",
    signerId: contract.candidateId as any, // fallback
    signatureUrl,
    signedAt: new Date(),
    ipAddress: req.ip
  });

  const hasCandidate = contract.signatures.some(s => s.signerType === "candidate");
  const hasEmployer = contract.signatures.some(s => s.signerType === "employer");

  if (hasCandidate && hasEmployer) {
    contract.signatureStatus = "fully_signed";
  } else if (hasCandidate) {
    contract.signatureStatus = "signed_candidate";
  } else if (hasEmployer) {
    contract.signatureStatus = "signed_employer";
  }

  await contract.save();
  return sendSuccess(res, contract, "Contract successfully signed!");
}

export async function downloadContractPdf(req: Request, res: Response) {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate("candidateId")
      .populate("employerId");
      
    if (!contract) return res.status(404).json({ success: false, message: "Contract not found" });

    const tenant = await Tenant.findById(contract.tenantId);

    const pdfBuffer = await generatePdf("employment-contract", {
      contract,
      tenant,
      candidate: contract.candidateId,
      employer: contract.employerId
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=contract-${contract._id}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate PDF" });
  }
}
