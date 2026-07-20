import { Schema, model, Document, Types } from "mongoose";

export interface ISupportTicket extends Document {
  tenantId: Types.ObjectId;
  submittedBy: Types.ObjectId;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: Types.ObjectId; // DeployX internal team member ID
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

supportTicketSchema.index({ tenantId: 1, status: 1 });

export const SupportTicket = model<ISupportTicket>("SupportTicket", supportTicketSchema);
