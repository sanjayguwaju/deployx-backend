import { Schema, model, Document, Types } from "mongoose";

export interface IOffice extends Document {
  tenantId: Types.ObjectId;
  officeNumber: number;
  nameNp?: string;
  officeAddress?: string;
  contactPhone?: string;
  population?: number;
  isActive: boolean;
}

const officeSchema = new Schema<IOffice>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    officeNumber: { type: Number, required: true },
    nameNp: String,
    officeAddress: String,
    contactPhone: String,
    population: Number,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

officeSchema.index({ tenantId: 1, officeNumber: 1 }, { unique: true });

export const Office = model<IOffice>("Office", officeSchema);
