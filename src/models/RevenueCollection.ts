import { Schema, model, Document, Types } from "mongoose";

export interface IRevenueCollection extends Document {
  municipalityId: Types.ObjectId;
  wardId: Types.ObjectId;
  revenueType: "property_tax" | "business_registration" | "rental_fee" | "service_fee" | "other";
  payerName: string;
  payerPhone?: string;
  amountNpr: number;
  receiptNumber: string;
  receiptUrl?: string;
  dateBs: string;
  collectedBy: Types.ObjectId;
}

const revenueCollectionSchema = new Schema<IRevenueCollection>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    wardId: { type: Schema.Types.ObjectId, ref: "Ward", required: true },
    revenueType: {
      type: String,
      enum: ["property_tax", "business_registration", "rental_fee", "service_fee", "other"],
      required: true,
    },
    payerName: { type: String, required: true },
    payerPhone: String,
    amountNpr: { type: Number, required: true, min: 0 },
    receiptNumber: { type: String, required: true },
    receiptUrl: String,
    dateBs: { type: String, required: true },
    collectedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

revenueCollectionSchema.index({ municipalityId: 1, receiptNumber: 1 }, { unique: true });

export const RevenueCollection = model<IRevenueCollection>("RevenueCollection", revenueCollectionSchema);
