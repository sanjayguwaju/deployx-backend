import { Schema, model, Document, Types } from "mongoose";

export interface IDisasterIncident extends Document {
  municipalityId: Types.ObjectId;
  wardId?: Types.ObjectId;
  type: string; // flood, landslide, fire, earthquake, etc.
  location?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  reportedDateBs: string;
  severity: "low" | "medium" | "high" | "critical";
  reportedBy?: Types.ObjectId;
  isDeleted: boolean;
}

const disasterIncidentSchema = new Schema<IDisasterIncident>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    wardId: { type: Schema.Types.ObjectId, ref: "Ward" },
    type: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [lng, lat]
        index: "2dsphere",
      },
    },
    reportedDateBs: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

disasterIncidentSchema.index({ municipalityId: 1, severity: 1 });
disasterIncidentSchema.index({ municipalityId: 1, isDeleted: 1 });
// 2dsphere index for GeoJSON queries (nearest incidents, within area)
disasterIncidentSchema.index({ location: "2dsphere" });

export const DisasterIncident = model<IDisasterIncident>("DisasterIncident", disasterIncidentSchema);
