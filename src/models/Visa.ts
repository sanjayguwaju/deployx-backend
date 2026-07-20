import { Schema, model, Document, Types } from "mongoose";

export interface IVisa extends Document {
  tenantId: Types.ObjectId;
  candidateId: Types.ObjectId;
  pipelineId: Types.ObjectId;
  visaNumber?: string;
  sponsorName?: string;
  embassy?: string;
  status: "applied" | "in_review" | "approved" | "rejected";
  expiryDate?: Date;
  documents: string[];
  timelineEvents: {
    event: string;
    date: Date;
    note?: string;
  }[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const visaSchema = new Schema<IVisa>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true },
    pipelineId: { type: Schema.Types.ObjectId, ref: "Pipeline", required: true },
    visaNumber: String,
    sponsorName: String,
    embassy: String,
    status: { type: String, enum: ["applied", "in_review", "approved", "rejected"], default: "applied" },
    expiryDate: Date,
    documents: [String],
    timelineEvents: [{
      event: { type: String, required: true },
      date: { type: Date, required: true },
      note: String
    }],
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

visaSchema.index({ tenantId: 1, candidateId: 1, pipelineId: 1 });
visaSchema.index({ expiryDate: 1 }); // For cron jobs

export const Visa = model<IVisa>("Visa", visaSchema);
