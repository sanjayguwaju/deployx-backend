import { Schema, model, Document, Types } from "mongoose";

export interface IComplianceCheck extends Document {
  tenantId: Types.ObjectId;
  entityType: "demand" | "deployment";
  entityId: Types.ObjectId;
  checkType: string; // e.g. "labour_approval", "embassy_clearance"
  status: "pending" | "passed" | "failed";
  documentUrl?: string;
  checkedAt?: Date;
  checkedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const complianceCheckSchema = new Schema<IComplianceCheck>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    entityType: { type: String, enum: ["demand", "deployment"], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    checkType: { type: String, required: true },
    status: { type: String, enum: ["pending", "passed", "failed"], default: "pending" },
    documentUrl: String,
    checkedAt: Date,
    checkedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

complianceCheckSchema.index({ tenantId: 1, entityId: 1, entityType: 1 });

export const ComplianceCheck = model<IComplianceCheck>("ComplianceCheck", complianceCheckSchema);
