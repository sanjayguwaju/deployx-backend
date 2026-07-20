import { Schema, model, Document, Types } from "mongoose";

export interface IDemand extends Document {
  tenantId: Types.ObjectId;
  officeId?: Types.ObjectId;
  trackingNumber: string;
  employerId: Types.ObjectId; // ref Employer
  employerName: string; // denormalized for quick search, or we can just populate. Spec kept it. Let's populate instead, but the older schema had it. We'll use employerId as required.
  country: string;
  profession: string;
  quantityRequired: number;
  salary?: {
    amount: number;
    currency: string;
  };
  accommodation?: {
    provided: boolean;
    details?: string;
  };
  food?: {
    provided: boolean;
    details?: string;
  };
  contract?: {
    durationMonths: number;
    termsUrl?: string;
  };
  interviewDate?: Date;
  documentsRequired: string[];
  
  status: "draft" | "pending_approval" | "approved" | "rejected" | "closed";
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdBy: Types.ObjectId;
  
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const demandSchema = new Schema<IDemand>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    officeId: { type: Schema.Types.ObjectId, ref: "Office" },
    trackingNumber: { type: String, required: true, unique: true },
    employerId: { type: Schema.Types.ObjectId, ref: "Employer", required: true },
    employerName: { type: String }, // optional denormalization if needed
    country: { type: String, required: true },
    profession: { type: String, required: true },
    quantityRequired: { type: Number, required: true, min: 1 },
    
    salary: {
      amount: Number,
      currency: String
    },
    accommodation: {
      provided: { type: Boolean, default: false },
      details: String
    },
    food: {
      provided: { type: Boolean, default: false },
      details: String
    },
    contract: {
      durationMonths: Number,
      termsUrl: String
    },
    
    interviewDate: Date,
    documentsRequired: [String],
    
    status: {
      type: String,
      enum: ["draft", "pending_approval", "approved", "rejected", "closed"],
      default: "draft",
    },
    
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    
    notes: String,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

demandSchema.index({ tenantId: 1, status: 1 });
demandSchema.index({ trackingNumber: 1 });

export const Demand = model<IDemand>("Demand", demandSchema);
