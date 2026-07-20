import { Schema, model, Document, Types } from "mongoose";

export interface IMedical extends Document {
  tenantId: Types.ObjectId;
  candidateId: Types.ObjectId;
  pipelineId: Types.ObjectId;
  bookedDate?: Date;
  hospitalName?: string;
  result: "pending" | "passed" | "failed";
  reportUrl?: string;
  expiryDate?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medicalSchema = new Schema<IMedical>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true },
    pipelineId: { type: Schema.Types.ObjectId, ref: "Pipeline", required: true },
    bookedDate: Date,
    hospitalName: String,
    result: { type: String, enum: ["pending", "passed", "failed"], default: "pending" },
    reportUrl: String,
    expiryDate: Date,
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

medicalSchema.index({ tenantId: 1, candidateId: 1, pipelineId: 1 });
medicalSchema.index({ expiryDate: 1 }); // For cron jobs

export const Medical = model<IMedical>("Medical", medicalSchema);
