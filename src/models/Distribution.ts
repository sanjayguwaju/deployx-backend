import { Schema, model, Document, Types } from "mongoose";

export interface IDistribution extends Document {
  municipalityId: Types.ObjectId;
  transactionId: Types.ObjectId;
  beneficiaryName: string;
  beneficiaryWardId?: Types.ObjectId;
  notes?: string;
}

const distributionSchema = new Schema<IDistribution>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    transactionId: { type: Schema.Types.ObjectId, ref: "InventoryTransaction", required: true },
    beneficiaryName: { type: String, required: true },
    beneficiaryWardId: { type: Schema.Types.ObjectId, ref: "Ward" },
    notes: String,
  },
  { timestamps: true },
);

distributionSchema.index({ municipalityId: 1, transactionId: 1 });

export const Distribution = model<IDistribution>("Distribution", distributionSchema);
