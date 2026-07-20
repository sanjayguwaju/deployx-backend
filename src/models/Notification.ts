import { Schema, model, Document, Types } from "mongoose";

export interface INotification extends Document {
  municipalityId: Types.ObjectId;
  recipientId?: Types.ObjectId;
  recipientPhone?: string;
  recipientEmail?: string;
  channel: "email" | "sms" | "push" | "in-app" | "whatsapp";
  templateId?: Types.ObjectId;
  subject?: string;
  body: string;
  status: "pending" | "sent" | "failed" | "delivered";
  sentAt?: Date;
  failReason?: string;
  readAt?: Date;
  entityType?: string;
  entityId?: Types.ObjectId;
}

const notificationSchema = new Schema<INotification>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User" },
    recipientPhone: String,
    recipientEmail: String,
    channel: { type: String, enum: ["email","sms","push","in-app","whatsapp"], required: true },
    templateId: { type: Schema.Types.ObjectId, ref: "CommunicationTemplate" },
    subject: String,
    body: { type: String, required: true },
    status: { type: String, enum: ["pending","sent","failed","delivered"], default: "pending" },
    sentAt: Date,
    failReason: String,
    readAt: Date,
    entityType: String,
    entityId: Schema.Types.ObjectId,
  },
  { timestamps: true },
);

notificationSchema.index({ recipientId: 1, readAt: 1 });
notificationSchema.index({ status: 1, createdAt: 1 });

export const Notification = model<INotification>("Notification", notificationSchema);
