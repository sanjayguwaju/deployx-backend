import { Schema, model, Document, Types } from "mongoose";

export interface ISignature {
  signerType: "candidate" | "employer" | "agent" | "staff";
  signerId: Types.ObjectId;
  signatureUrl?: string; // S3/R2 path to base64 image or signature pad output
  signedAt?: Date;
  ipAddress?: string;
}

export interface IContract extends Document {
  tenantId: Types.ObjectId;
  templateId: Types.ObjectId;
  candidateId?: Types.ObjectId;
  employerId?: Types.ObjectId;
  demandId?: Types.ObjectId;
  pdfUrl?: string; // S3/R2 path to rendered snapshot
  signatureStatus: "draft" | "sent" | "signed_candidate" | "signed_employer" | "fully_signed";
  signatures: ISignature[];
  createdAt: Date;
  updatedAt: Date;
}

const contractSchema = new Schema<IContract>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    templateId: { type: Schema.Types.ObjectId, ref: "ContractTemplate", required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "Candidate" },
    employerId: { type: Schema.Types.ObjectId, ref: "Employer" },
    demandId: { type: Schema.Types.ObjectId, ref: "Demand" },
    pdfUrl: String,
    signatureStatus: { 
      type: String, 
      enum: ["draft", "sent", "signed_candidate", "signed_employer", "fully_signed"], 
      default: "draft" 
    },
    signatures: [{
      signerType: { type: String, enum: ["candidate", "employer", "agent", "staff"], required: true },
      signerId: { type: Schema.Types.ObjectId, required: true },
      signatureUrl: String,
      signedAt: Date,
      ipAddress: String
    }],
  },
  { timestamps: true },
);

contractSchema.index({ tenantId: 1, candidateId: 1 });
contractSchema.index({ tenantId: 1, employerId: 1 });

export const Contract = model<IContract>("Contract", contractSchema);
