import { Schema, model, Document, Types } from "mongoose";

export interface ICorrespondence extends Document {
  municipalityId: Types.ObjectId;
  wardId?: Types.ObjectId;
  referenceNumber: string;
  fiscalYear: string;
  sequenceNumber: number;
  type: "letter" | "memo" | "notice" | "order" | "report";
  direction: "incoming" | "outgoing" | "internal";
  subject: string;
  subjectNp?: string;
  body?: string;
  fromEntity?: string;
  toEntity?: string;
  fromUserId?: Types.ObjectId;
  toUserId?: Types.ObjectId;
  dateBs: string;
  dateAd?: Date;
  deadlineBs?: string;
  status: "draft" | "sent" | "received" | "acknowledged" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  pdfUrl?: string;
  isDeleted: boolean;
}

const correspondenceSchema = new Schema<ICorrespondence>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    wardId: { type: Schema.Types.ObjectId, ref: "Ward" },
    referenceNumber: { type: String, required: true, unique: true },
    fiscalYear: { type: String, required: true },
    sequenceNumber: { type: Number, required: true },
    type: { type: String, enum: ["letter","memo","notice","order","report"], required: true },
    direction: { type: String, enum: ["incoming","outgoing","internal"], required: true },
    subject: { type: String, required: true },
    subjectNp: String,
    body: String,
    fromEntity: String, toEntity: String,
    fromUserId: { type: Schema.Types.ObjectId, ref: "User" },
    toUserId: { type: Schema.Types.ObjectId, ref: "User" },
    dateBs: { type: String, required: true },
    dateAd: Date,
    deadlineBs: String,
    status: { type: String, enum: ["draft","sent","received","acknowledged","closed"], default: "draft" },
    priority: { type: String, enum: ["low","normal","high","urgent"], default: "normal" },
    pdfUrl: String,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

correspondenceSchema.index({ municipalityId: 1, fiscalYear: 1 });

export const Correspondence = model<ICorrespondence>("Correspondence", correspondenceSchema);
