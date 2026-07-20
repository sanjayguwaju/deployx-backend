import { Schema, model, Document, Types } from "mongoose";

export interface IDamageAssessment extends Document {
  incidentId: Types.ObjectId;
  description: string;
  estimatedLossNpr?: number;
  assessedBy?: Types.ObjectId;
}

const damageAssessmentSchema = new Schema<IDamageAssessment>(
  {
    incidentId: { type: Schema.Types.ObjectId, ref: "DisasterIncident", required: true },
    description: { type: String, required: true },
    estimatedLossNpr: { type: Number, min: 0 },
    assessedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

damageAssessmentSchema.index({ incidentId: 1 });

export const DamageAssessment = model<IDamageAssessment>("DamageAssessment", damageAssessmentSchema);
