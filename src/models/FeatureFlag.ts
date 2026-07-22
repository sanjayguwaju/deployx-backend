import { Schema, model, Document, Types } from "mongoose";

export interface IFeatureFlag extends Document {
  tenantId?: Types.ObjectId;
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
  isSystemFlag?: boolean;
  enabledOffices: Types.ObjectId[];
}

const featureFlagSchema = new Schema<IFeatureFlag>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: false },
    key: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    isActive: { type: Boolean, default: false },
    isSystemFlag: { type: Boolean, default: false },
    enabledOffices: [{ type: Schema.Types.ObjectId, ref: "Ward" }],
  },
  { timestamps: true }
);

featureFlagSchema.index({ tenantId: 1, key: 1 }, { unique: true });

export const FeatureFlag = model<IFeatureFlag>("FeatureFlag", featureFlagSchema);
