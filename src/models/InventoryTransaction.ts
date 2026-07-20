import { Schema, model, Document, Types } from "mongoose";

export interface IInventoryTransaction extends Document {
  municipalityId: Types.ObjectId;
  itemId: Types.ObjectId;
  direction: "in" | "out";
  quantity: number;
  dateBs: string;
  actorId?: Types.ObjectId;
  notes?: string;
}

const inventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    direction: { type: String, enum: ["in", "out"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    dateBs: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    notes: String,
  },
  { timestamps: true },
);

inventoryTransactionSchema.index({ municipalityId: 1, itemId: 1, direction: 1 });
inventoryTransactionSchema.index({ municipalityId: 1, dateBs: 1 });

export const InventoryTransaction = model<IInventoryTransaction>("InventoryTransaction", inventoryTransactionSchema);
