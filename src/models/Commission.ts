import { Schema, model, Document, Types } from "mongoose";

export interface ICommission extends Document {
  tenantId: Types.ObjectId;
  agentId: Types.ObjectId;
  candidateId: Types.ObjectId;
  demandId?: Types.ObjectId;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "paid";
  approvedBy?: Types.ObjectId;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const commissionSchema = new Schema<ICommission>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true },
    demandId: { type: Schema.Types.ObjectId, ref: "Demand" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: { type: String, enum: ["pending", "approved", "paid"], default: "pending" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    paidAt: Date,
  },
  { timestamps: true }
);

commissionSchema.index({ tenantId: 1, agentId: 1 });
commissionSchema.index({ tenantId: 1, candidateId: 1 });

export const Commission = model<ICommission>("Commission", commissionSchema);
