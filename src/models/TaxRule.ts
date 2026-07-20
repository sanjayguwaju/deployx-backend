import mongoose, { Schema, Document } from "mongoose";

export interface ITaxRule extends Document {
  municipalityId: mongoose.Types.ObjectId;
  name: string;
  taxType: "property" | "business" | "vehicle" | "other";
  baseRate: number;
  multiplier: number; // e.g. for commercial vs residential
  conditions: any; // JSON string or object to evaluate rules (e.g., { zone: 'A' })
  fiscalYear: string; // e.g., '2080/81'
  isActive: boolean;
}

const TaxRuleSchema: Schema = new Schema(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    name: { type: String, required: true },
    taxType: { type: String, enum: ["property", "business", "vehicle", "other"], required: true },
    baseRate: { type: Number, required: true },
    multiplier: { type: Number, default: 1 },
    conditions: { type: Schema.Types.Mixed, default: {} },
    fiscalYear: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const TaxRule = mongoose.model<ITaxRule>("TaxRule", TaxRuleSchema);
