import { Schema, model, Document, Types } from "mongoose";

export interface IInfraPayment extends Document {
  projectId: Types.ObjectId;
  milestoneId?: Types.ObjectId; // Optional: Some payments are advances
  amountNpr: number;
  approvalId?: Types.ObjectId;
  status: "pending" | "approved" | "paid" | "rejected";
  paidAtBs?: string;
}

const infraPaymentSchema = new Schema<IInfraPayment>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "InfraProject", required: true },
    milestoneId: { type: Schema.Types.ObjectId, ref: "InfraMilestone" },
    amountNpr: { type: Number, required: true, min: 0 },
    approvalId: { type: Schema.Types.ObjectId, ref: "ApprovableDocument" },
    status: {
      type: String,
      enum: ["pending", "approved", "paid", "rejected"],
      default: "pending",
    },
    paidAtBs: String,
  },
  { timestamps: true }
);

infraPaymentSchema.index({ projectId: 1, status: 1 });

export const InfraPayment = model<IInfraPayment>("InfraPayment", infraPaymentSchema);
