import { Schema, model, Document, Types } from "mongoose";

export interface IHealthPost extends Document {
  municipalityId: Types.ObjectId;
  wardId: Types.ObjectId;
  name: string;
  nameNp?: string;
  staffCount?: number;
  catchmentPopulation?: number;
  isActive: boolean;
  isDeleted: boolean;
}

const healthPostSchema = new Schema<IHealthPost>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    wardId: { type: Schema.Types.ObjectId, ref: "Ward", required: true },
    name: { type: String, required: true },
    nameNp: String,
    staffCount: { type: Number, default: 0 },
    catchmentPopulation: Number,
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

healthPostSchema.index({ municipalityId: 1, wardId: 1 });
healthPostSchema.index({ municipalityId: 1, isDeleted: 1 });

export const HealthPost = model<IHealthPost>("HealthPost", healthPostSchema);
