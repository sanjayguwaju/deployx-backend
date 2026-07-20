import { Schema, model, Document, Types } from "mongoose";

export interface IExpense extends Document {
  tenantId: Types.ObjectId;
  category: string;
  amount: number;
  currency: string;
  description: string;
  relatedDemandId?: Types.ObjectId;
  relatedCandidateId?: Types.ObjectId;
  incurredAt: Date;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    description: { type: String, required: true },
    relatedDemandId: { type: Schema.Types.ObjectId, ref: "Demand" },
    relatedCandidateId: { type: Schema.Types.ObjectId, ref: "Candidate" },
    incurredAt: { type: Date, default: Date.now },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

expenseSchema.index({ tenantId: 1, relatedCandidateId: 1 });
expenseSchema.index({ tenantId: 1, relatedDemandId: 1 });

export const Expense = model<IExpense>("Expense", expenseSchema);
