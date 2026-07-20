import { Schema, model, Document, Types } from "mongoose";

export interface IComplaint extends Document {
  municipalityId: Types.ObjectId;
  wardId?: Types.ObjectId;
  trackingNumber: string;
  category?: string;
  subject: string;
  description: string;
  isAnonymous: boolean;
  complainantName?: string;
  complainantPhone?: string;
  status: "received" | "under_investigation" | "resolved" | "closed" | "referred";
  priority: "low" | "normal" | "high" | "urgent";
  assignedTo?: Types.ObjectId;
  dueAt?: Date;
  resolvedAt?: Date;
  resolution?: string;
  isDeleted: boolean;
}

const complaintSchema = new Schema<IComplaint>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    wardId: { type: Schema.Types.ObjectId, ref: "Ward" },
    trackingNumber: { type: String, required: true, unique: true },
    category: String,
    subject: { type: String, required: true },
    description: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    complainantName: String,
    complainantPhone: String,
    status: {
      type: String,
      enum: ["received","under_investigation","resolved","closed","referred"],
      default: "received",
    },
    priority: { type: String, enum: ["low","normal","high","urgent"], default: "normal" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    dueAt: Date,
    resolvedAt: Date,
    resolution: String,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

complaintSchema.index({ municipalityId: 1, status: 1 });

export const Complaint = model<IComplaint>("Complaint", complaintSchema);
