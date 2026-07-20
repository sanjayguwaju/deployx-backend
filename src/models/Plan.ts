import { Schema, model, Document, Types } from "mongoose";

export interface IPlan extends Document {
  name: string;
  price: number;
  billingInterval: "monthly" | "yearly";
  includedFeatures: string[];
  userLimit: number;
  officeLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    billingInterval: { type: String, enum: ["monthly", "yearly"], required: true },
    includedFeatures: [{ type: String }],
    userLimit: { type: Number, required: true },
    officeLimit: { type: Number, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Plan = model<IPlan>("Plan", planSchema);
