import { Schema, model, Document, Types } from "mongoose";

export interface IApiKey extends Document {
  tenantId: Types.ObjectId;
  name: string;
  keyHash: string; // Stored securely
  prefix: string; // First 8 chars for display
  lastUsedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    keyHash: { type: String, required: true },
    prefix: { type: String, required: true },
    lastUsedAt: Date,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

apiKeySchema.index({ tenantId: 1 });

export const ApiKey = model<IApiKey>("ApiKey", apiKeySchema);
