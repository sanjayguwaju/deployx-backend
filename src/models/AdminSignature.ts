import { Schema, model, Document, Types } from "mongoose";

export interface IAdminSignature extends Document {
  documentId: Types.ObjectId;
  signerId: Types.ObjectId;
  signedAtBs: string;
  /** SHA-256 of (documentId + signerId + timestamp) — tamper-evident, written once, never updated */
  signatureHash: string;
}

const adminSignatureSchema = new Schema<IAdminSignature>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "AdminDocument", required: true },
    signerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    signedAtBs: { type: String, required: true },
    signatureHash: { type: String, required: true },
  },
  {
    timestamps: true,
    // Signatures are append-only — no updates or deletes allowed at application level
  },
);

adminSignatureSchema.index({ documentId: 1 });

export const AdminSignature = model<IAdminSignature>("AdminSignature", adminSignatureSchema);
