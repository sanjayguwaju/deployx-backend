import { Schema, model, Document, Types } from "mongoose";

export interface ISchoolPerformance extends Document {
  schoolId: Types.ObjectId;
  fiscalYear: string; // Nepali FY e.g. "2081-82"
  grade: string;
  totalStudents: number;
  passed: number;
  failed: number;
}

const schoolPerformanceSchema = new Schema<ISchoolPerformance>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    fiscalYear: { type: String, required: true },
    grade: { type: String, required: true },
    totalStudents: { type: Number, required: true, default: 0 },
    passed: { type: Number, required: true, default: 0 },
    failed: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

schoolPerformanceSchema.index({ schoolId: 1, fiscalYear: 1 });

export const SchoolPerformance = model<ISchoolPerformance>("SchoolPerformance", schoolPerformanceSchema);
