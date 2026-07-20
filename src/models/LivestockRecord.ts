import { Schema, model, Document, Types } from "mongoose";

export interface ILivestockRecord extends Document {
  municipalityId: Types.ObjectId;
  wardId: Types.ObjectId;
  farmerName: string;
  animalType: "goat" | "sheep" | "buffalo" | "cow";
  count: number;
  isDeleted: boolean;
}

const livestockRecordSchema = new Schema<ILivestockRecord>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    wardId: { type: Schema.Types.ObjectId, ref: "Ward", required: true },
    farmerName: { type: String, required: true },
    animalType: {
      type: String,
      enum: ["goat", "sheep", "buffalo", "cow"],
      required: true,
    },
    count: { type: Number, required: true, min: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

livestockRecordSchema.index({ municipalityId: 1, animalType: 1 });
livestockRecordSchema.index({ municipalityId: 1, isDeleted: 1 });

export const LivestockRecord = model<ILivestockRecord>("LivestockRecord", livestockRecordSchema);
