import { Schema, model, Document, Types } from "mongoose";

export interface ILicense extends Document {
  tenantId: Types.ObjectId;
  licenseType: string; // e.g. "Agency License", "Tax Clearance"
  licenseNumber: string;
  issuingAuthority: string;
  issuedDate: Date;
  expiryDate: Date;
  documentUrl?: string;
  status: "active" | "expiring" | "expired";
  createdAt: Date;
  updatedAt: Date;
}

const licenseSchema = new Schema<ILicense>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    licenseType: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    issuingAuthority: { type: String, required: true },
    issuedDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    documentUrl: String,
    status: { type: String, enum: ["active", "expiring", "expired"], default: "active" }
  },
  { timestamps: true }
);

licenseSchema.index({ tenantId: 1, expiryDate: 1 });

export const License = model<ILicense>("License", licenseSchema);
