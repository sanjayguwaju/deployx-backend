import mongoose, { Schema, Document } from "mongoose";

export interface IWhatsappInstance extends Document {
  tenantId: mongoose.Types.ObjectId;
  instanceName: string; // Typically generated as `tenant-${tenantId}`
  status: "disconnected" | "connecting" | "connected" | "error";
  qrCodeUrl?: string;
  phoneNumber?: string;
  webhookUrl?: string;
  lastConnectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsappInstanceSchema = new Schema<IWhatsappInstance>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, unique: true },
    instanceName: { type: String, required: true, unique: true },
    status: { 
      type: String, 
      enum: ["disconnected", "connecting", "connected", "error"], 
      default: "disconnected" 
    },
    qrCodeUrl: { type: String },
    phoneNumber: { type: String },
    webhookUrl: { type: String },
    lastConnectedAt: { type: Date },
  },
  { timestamps: true }
);

export const WhatsappInstance = mongoose.model<IWhatsappInstance>("WhatsappInstance", WhatsappInstanceSchema);
