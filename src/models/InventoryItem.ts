import { Schema, model, Document, Types } from "mongoose";

export type InventoryModule = "health" | "education" | "agriculture";

export interface IInventoryItem extends Document {
  municipalityId: Types.ObjectId;
  module: InventoryModule;
  category: string; // e.g. "medicine", "book", "seed"
  name: string;
  nameNp?: string;
  unit: string; // e.g. "bottle", "piece", "kg"
  isDeleted: boolean;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    module: { type: String, enum: ["health", "education", "agriculture"], required: true },
    category: { type: String, required: true },
    name: { type: String, required: true },
    nameNp: String,
    unit: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

inventoryItemSchema.index({ municipalityId: 1, module: 1 });
inventoryItemSchema.index({ municipalityId: 1, isDeleted: 1 });

export const InventoryItem = model<IInventoryItem>("InventoryItem", inventoryItemSchema);
