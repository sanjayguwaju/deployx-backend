import { Schema, model, Document, Types } from "mongoose";

export interface IInfraMilestone extends Document {
  projectId: Types.ObjectId;
  description: string;
  targetDateBs?: string;
  completionDateBs?: string; // null until completed
  evidenceUrls: string[]; // R2/S3 URLs via existing /upload module
  approvalId?: Types.ObjectId; // ref: ApprovableDocument — sign-off before marking complete
}

const infraMilestoneSchema = new Schema<IInfraMilestone>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "InfraProject", required: true },
    description: { type: String, required: true },
    targetDateBs: String,
    completionDateBs: String,
    evidenceUrls: [{ type: String }],
    approvalId: { type: Schema.Types.ObjectId, ref: "ApprovableDocument" },
  },
  { timestamps: true },
);

infraMilestoneSchema.index({ projectId: 1 });

export const InfraMilestone = model<IInfraMilestone>("InfraMilestone", infraMilestoneSchema);
