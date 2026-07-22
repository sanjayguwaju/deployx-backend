import { Schema, model, Document, Types } from "mongoose";

export interface ICandidate extends Document {
  tenantId: Types.ObjectId;
  officeId: Types.ObjectId;
  householdId?: Types.ObjectId;
  firstName: string;
  middleName?: string;
  lastName: string;
  firstNameNp?: string;
  lastNameNp?: string;
  gender?: "male" | "female" | "other";
  dateOfBirthAd?: Date;
  dateOfBirthBs?: string;
  passportNumber?: string;
  citizenshipIssuedDistrict?: string;
  nationalIdNumber?: string;
  phone?: string;
  email?: string;
  permanentAddress?: string;
  occupation?: string;
  photoUrl?: string;
  isVerified: boolean;
  
  // Phase 4 - Portal Extensions
  referringAgentId?: Types.ObjectId;
  contactUpdatePending?: {
    phone?: string;
    email?: string;
    whatsapp?: string;
    permanentAddress?: string;
    submittedAt?: Date;
  };
  
  // Phase 1 extensions
  languages?: string[];
  religion?: string;
  maritalStatus?: string;
  whatsapp?: string;
  address?: {
    province?: string;
    district?: string;
    city?: string;
    office?: string;
  };
  profession?: string;
  experienceYears?: number;
  certifications?: string[];
  education?: string[];
  documents?: {
    _id?: Types.ObjectId;
    fileUrl: string;
    type: string;
    uploadedAt: Date;
    uploadedBy: Types.ObjectId;
    verified: boolean;
  }[];
  
  status: "registered" | "interview_scheduled" | "selected" | "medical" | "visa_processing" | "ticket_booked" | "deployed" | "returned" | "rejected" | "blacklisted";
  isDeleted: boolean;
}

const candidateSchema = new Schema<ICandidate>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    officeId: { type: Schema.Types.ObjectId, ref: "Office", required: true },
    householdId: { type: Schema.Types.ObjectId },
    firstName: { type: String, required: true },
    middleName: String,
    lastName: { type: String, required: true },
    firstNameNp: String,
    lastNameNp: String,
    gender: { type: String, enum: ["male", "female", "other"] },
    dateOfBirthAd: Date,
    dateOfBirthBs: String,
    passportNumber: { type: String, sparse: true },
    citizenshipIssuedDistrict: String,
    nationalIdNumber: String,
    phone: String,
    email: String,
    permanentAddress: String,
    occupation: String,
    photoUrl: String,
    isVerified: { type: Boolean, default: false },

    // Phase 4 Extensions
    referringAgentId: { type: Schema.Types.ObjectId, ref: "User" },
    contactUpdatePending: {
      phone: String,
      email: String,
      whatsapp: String,
      permanentAddress: String,
      submittedAt: Date,
    },

    // Phase 1 extensions
    languages: [String],
    religion: String,
    maritalStatus: String,
    whatsapp: String,
    address: {
      province: String,
      district: String,
      city: String,
      office: String,
    },
    profession: String,
    experienceYears: Number,
    certifications: [String],
    education: [String],
    documents: [{
      fileUrl: { type: String, required: true },
      type: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
      verified: { type: Boolean, default: false }
    }],

    status: { 
      type: String, 
      enum: ["registered", "interview_scheduled", "selected", "medical", "visa_processing", "ticket_booked", "deployed", "returned", "rejected", "blacklisted"], 
      default: "registered" 
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

candidateSchema.index({ tenantId: 1, isDeleted: 1 });
candidateSchema.index({ passportNumber: 1 }, { sparse: true });
candidateSchema.index({ firstName: "text", lastName: "text" });

export const Candidate = model<ICandidate>("Candidate", candidateSchema);
