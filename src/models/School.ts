import { Schema, model, Document, Types } from "mongoose";

export interface ISchool extends Document {
  municipalityId: Types.ObjectId;
  wardId: Types.ObjectId;
  name: string;
  nameNp?: string;
  level: "basic" | "secondary";
  staffCount?: number;
  isActive: boolean;
  isDeleted: boolean;
}

const schoolSchema = new Schema<ISchool>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    wardId: { type: Schema.Types.ObjectId, ref: "Ward", required: true },
    name: { type: String, required: true },
    nameNp: String,
    level: { type: String, enum: ["basic", "secondary"], default: "basic" },
    staffCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

schoolSchema.index({ municipalityId: 1, isActive: 1 });
schoolSchema.index({ municipalityId: 1, isDeleted: 1 });

export const School = model<ISchool>("School", schoolSchema);
