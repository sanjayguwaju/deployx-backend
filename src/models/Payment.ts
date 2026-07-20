import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  municipalityId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  amount: number;
  status: "pending" | "completed" | "failed";
  provider: "esewa" | "khalti" | "bank_transfer";
  transactionId?: string;
  paymentDate?: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    provider: { type: String, enum: ["esewa", "khalti", "bank_transfer"], required: true },
    transactionId: { type: String },
    paymentDate: { type: Date },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
