import { Schema, model, Document, Types } from "mongoose";

export type ApprovableModule = "administrative" | "disaster_management" | "infrastructure" | "budget_allocation" | "infra_payment";

export interface IApprovalHistoryEntry {
  actorId: Types.ObjectId;
  level: number;
  action: "approve" | "reject";
  atBs: string;
  comment?: string;
}

export interface IApprovableDocument extends Document {
  municipalityId: Types.ObjectId;
  module: ApprovableModule;
  recordType: string;      // e.g. "AdminDocument", "ReliefApplication", "InfraMilestone"
  recordId: Types.ObjectId;
  /** Maps to existing Role.level (0-5). Approval requires role level <= this value */
  currentLevelRequired: number;
  status: "pending" | "approved" | "rejected";
  history: IApprovalHistoryEntry[];
}

const approvalHistorySchema = new Schema<IApprovalHistoryEntry>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    level: { type: Number, required: true },
    action: { type: String, enum: ["approve", "reject"], required: true },
    atBs: { type: String, required: true },
    comment: String,
  },
  { _id: false },
);

const approvableDocumentSchema = new Schema<IApprovableDocument>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    module: {
      type: String,
      enum: ["administrative", "disaster_management", "infrastructure"],
      required: true,
    },
    recordType: { type: String, required: true },
    recordId: { type: Schema.Types.ObjectId, required: true },
    currentLevelRequired: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    history: [approvalHistorySchema],
  },
  { timestamps: true },
);

approvableDocumentSchema.index({ municipalityId: 1, status: 1 });
approvableDocumentSchema.index({ recordId: 1, recordType: 1 });
approvableDocumentSchema.index({ municipalityId: 1, currentLevelRequired: 1, status: 1 });

export const ApprovableDocument = model<IApprovableDocument>("ApprovableDocument", approvableDocumentSchema);
