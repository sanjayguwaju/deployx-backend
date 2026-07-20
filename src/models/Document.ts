import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface IDocument extends MongooseDocument {
  tenantId: mongoose.Types.ObjectId;
  ownerType: "candidate" | "employer" | "demand" | "contract";
  ownerId: mongoose.Types.ObjectId;
  documentType: string; // e.g. passport, cv, contract
  fileUrl: string;
  tags?: string[];
  
  // Optional legacy / verified fields
  templateName?: string;
  data?: Record<string, any>;
  issuedBy?: mongoose.Types.ObjectId;
  verificationHash?: string;
  issueDate?: Date;
  status?: "valid" | "revoked";
  qrCodeUrl?: string;
}

const DocumentSchema = new Schema<IDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    ownerType: { type: String, enum: ["candidate", "employer", "demand", "contract"], required: true },
    ownerId: { type: Schema.Types.ObjectId, required: true },
    documentType: { type: String, required: true },
    fileUrl: { type: String, required: true },
    tags: [{ type: String }],

    templateName: { type: String },
    data: { type: Schema.Types.Mixed, default: {} },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verificationHash: { type: String, unique: true, sparse: true },
    issueDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["valid", "revoked"], default: "valid" },
    qrCodeUrl: { type: String },
  },
  { timestamps: true }
);

export const AppDocument = mongoose.model<IDocument>("Document", DocumentSchema);
