import { Schema, model, Document, Types } from "mongoose";

export interface ICommunicationTemplate extends Document {
  tenantId: Types.ObjectId;
  name: string;
  channel: "email" | "sms" | "whatsapp" | "in-app";
  subject?: string; // Optional for SMS/WhatsApp
  body: string; // Merge fields e.g., {{candidate.firstName}}
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const communicationTemplateSchema = new Schema<ICommunicationTemplate>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    channel: { type: String, enum: ["email", "sms", "whatsapp", "in-app"], required: true },
    subject: String,
    body: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

communicationTemplateSchema.index({ tenantId: 1, channel: 1 });

export const CommunicationTemplate = model<ICommunicationTemplate>("CommunicationTemplate", communicationTemplateSchema);
