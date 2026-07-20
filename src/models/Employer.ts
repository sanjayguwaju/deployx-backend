import { Schema, model, Document, Types } from "mongoose";

export interface IEmployer extends Document {
  tenantId: Types.ObjectId;
  companyName: string;
  country: string;
  logoUrl?: string;
  industry?: string;
  contactPersons: {
    name: string;
    designation?: string;
    phone?: string;
    email?: string;
  }[];
  agreements: {
    documentUrl: string;
    signedDate?: Date;
    expiryDate?: Date;
    status: "active" | "expired" | "pending";
  }[];
  paymentStatus?: "good_standing" | "overdue" | "suspended";
  notes?: string[];
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const employerSchema = new Schema<IEmployer>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    companyName: { type: String, required: true },
    country: { type: String, required: true },
    logoUrl: String,
    industry: String,
    contactPersons: [{
      name: { type: String, required: true },
      designation: String,
      phone: String,
      email: String
    }],
    agreements: [{
      documentUrl: { type: String, required: true },
      signedDate: Date,
      expiryDate: Date,
      status: { type: String, enum: ["active", "expired", "pending"], default: "pending" }
    }],
    paymentStatus: { type: String, enum: ["good_standing", "overdue", "suspended"], default: "good_standing" },
    notes: [String],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

employerSchema.index({ tenantId: 1, isDeleted: 1 });
employerSchema.index({ companyName: "text", country: 1 });

export const Employer = model<IEmployer>("Employer", employerSchema);
