import { Schema, model, Document, Types } from "mongoose";

export interface IDeployment extends Document {
  tenantId: Types.ObjectId;
  candidateId: Types.ObjectId;
  pipelineId: Types.ObjectId;
  actualDeploymentDate?: Date;
  departureAirport?: string;
  receivingCompany?: string;
  receivingContact?: string;
  arrivalConfirmation: {
    confirmed: boolean;
    confirmedAt?: Date;
    confirmedBy?: Types.ObjectId;
  };
  digitalSignatureUrl?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const deploymentSchema = new Schema<IDeployment>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true },
    pipelineId: { type: Schema.Types.ObjectId, ref: "Pipeline", required: true },
    actualDeploymentDate: Date,
    departureAirport: String,
    receivingCompany: String,
    receivingContact: String,
    arrivalConfirmation: {
      confirmed: { type: Boolean, default: false },
      confirmedAt: Date,
      confirmedBy: { type: Schema.Types.ObjectId, ref: "User" }
    },
    digitalSignatureUrl: String,
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

deploymentSchema.index({ tenantId: 1, candidateId: 1, pipelineId: 1 });

export const Deployment = model<IDeployment>("Deployment", deploymentSchema);
