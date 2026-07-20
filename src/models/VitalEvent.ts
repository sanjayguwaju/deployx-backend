import mongoose, { Schema, Document } from "mongoose";

export interface IVitalEvent extends Document {
  municipalityId: mongoose.Types.ObjectId;
  wardId: mongoose.Types.ObjectId;
  applicantId: mongoose.Types.ObjectId;
  eventType: "birth" | "death" | "marriage" | "migration";
  eventDate: Date; // BS/AD stored as AD Date
  eventDateBs: string;
  details: any; // Dynamic details based on eventType (e.g., infant name, spouse name, etc.)
  status: "pending" | "approved" | "rejected";
  certificateNumber?: string;
  approvedBy?: mongoose.Types.ObjectId;
}

const VitalEventSchema: Schema = new Schema(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    wardId: { type: Schema.Types.ObjectId, ref: "Ward", required: true },
    applicantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventType: { type: String, enum: ["birth", "death", "marriage", "migration"], required: true },
    eventDate: { type: Date, required: true },
    eventDateBs: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    certificateNumber: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const VitalEvent = mongoose.model<IVitalEvent>("VitalEvent", VitalEventSchema);
