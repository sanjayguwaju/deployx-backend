import { Schema, model, Document, Types } from "mongoose";

export interface IContractTemplate extends Document {
  tenantId: Types.ObjectId;
  name: string;
  templateBody: string; // HTML with mustache merge fields
  applicableTo: "employment_contract" | "offer_letter" | "demand_letter" | "mou";
  createdAt: Date;
  updatedAt: Date;
}

const contractTemplateSchema = new Schema<IContractTemplate>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    templateBody: { type: String, required: true },
    applicableTo: { 
      type: String, 
      enum: ["employment_contract", "offer_letter", "demand_letter", "mou"], 
      required: true 
    },
  },
  { timestamps: true },
);

contractTemplateSchema.index({ tenantId: 1, applicableTo: 1 });

export const ContractTemplate = model<IContractTemplate>("ContractTemplate", contractTemplateSchema);
