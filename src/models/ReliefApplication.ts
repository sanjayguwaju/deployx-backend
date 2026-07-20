import { Schema, model, Document, Types } from "mongoose";

export interface IReliefApplication extends Document {
  incidentId: Types.ObjectId;
  applicantName: string;
  applicantPhone?: string;
  requestedAmountNpr?: number;
  approvalId?: Types.ObjectId; // ref: ApprovableDocument
  status: "pending" | "approved" | "rejected" | "disbursed";
  disbursedAmountNpr?: number;
  disbursedAtBs?: string;
  isDeleted: boolean;
}

const reliefApplicationSchema = new Schema<IReliefApplication>(
  {
    incidentId: { type: Schema.Types.ObjectId, ref: "DisasterIncident", required: true },
    applicantName: { type: String, required: true },
    applicantPhone: String,
    requestedAmountNpr: { type: Number, min: 0 },
    approvalId: { type: Schema.Types.ObjectId, ref: "ApprovableDocument" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "disbursed"],
      default: "pending",
    },
    disbursedAmountNpr: { type: Number, min: 0 },
    disbursedAtBs: String,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

reliefApplicationSchema.index({ incidentId: 1, status: 1 });

export const ReliefApplication = model<IReliefApplication>("ReliefApplication", reliefApplicationSchema);
