import { Schema, model, Document, Types } from "mongoose";

export type PipelineStage = "applied" | "shortlisted" | "interview" | "selected" | "medical" | "visa" | "ticket" | "deployment" | "completed" | "rejected";

export interface IPipeline extends Document {
  tenantId: Types.ObjectId;
  candidateId: Types.ObjectId;
  demandId: Types.ObjectId;
  stage: PipelineStage;
  stageHistory: {
    stage: PipelineStage;
    enteredAt: Date;
    enteredBy: Types.ObjectId;
  }[];
  score?: number;
  assignedTo?: Types.ObjectId;
  notes?: string[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pipelineSchema = new Schema<IPipeline>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true },
    demandId: { type: Schema.Types.ObjectId, ref: "Demand", required: true },
    stage: {
      type: String,
      enum: ["applied", "shortlisted", "interview", "selected", "medical", "visa", "ticket", "deployment", "completed", "rejected"],
      default: "applied"
    },
    stageHistory: [{
      stage: { type: String, required: true },
      enteredAt: { type: Date, default: Date.now },
      enteredBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
    }],
    score: Number,
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    notes: [String],
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

pipelineSchema.index({ tenantId: 1, demandId: 1, stage: 1 });
pipelineSchema.index({ candidateId: 1, demandId: 1 }, { unique: true }); // A candidate should be in a demand's pipeline only once

export const Pipeline = model<IPipeline>("Pipeline", pipelineSchema);
