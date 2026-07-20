import { Schema, model, Document, Types } from "mongoose";

export interface IBudgetAllocation extends Document {
  municipalityId: Types.ObjectId;
  fiscalYear: string;
  sectionSlug: string;
  wardId?: Types.ObjectId;
  allocatedAmountNpr: number;
  spentAmountNpr: number;
  approvalId?: Types.ObjectId;
  status: "draft" | "approved" | "exhausted" | "closed";
}

const budgetAllocationSchema = new Schema<IBudgetAllocation>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    fiscalYear: { type: String, required: true },
    sectionSlug: { type: String, required: true },
    wardId: { type: Schema.Types.ObjectId, ref: "Ward" },
    allocatedAmountNpr: { type: Number, required: true, min: 0 },
    spentAmountNpr: { type: Number, default: 0, min: 0 },
    approvalId: { type: Schema.Types.ObjectId, ref: "ApprovableDocument" },
    status: {
      type: String,
      enum: ["draft", "approved", "exhausted", "closed"],
      default: "draft",
    },
  },
  { timestamps: true }
);

budgetAllocationSchema.index(
  { municipalityId: 1, fiscalYear: 1, sectionSlug: 1, wardId: 1 },
  { unique: true }
);

export const BudgetAllocation = model<IBudgetAllocation>("BudgetAllocation", budgetAllocationSchema);
