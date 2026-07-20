import { Schema, model, Document, Types } from "mongoose";

const regBase = {
  municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
  wardId: { type: Schema.Types.ObjectId, ref: "Ward", required: true },
  registrationNumber: { type: String, required: true, unique: true },
  registrationDateBs: { type: String, required: true },
  registrationDateAd: Date,
  status: { type: String, enum: ["pending","verified","certificate_issued","rejected"], default: "pending" },
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  verifiedAt: Date,
  certificateUrl: String,
  remarks: String,
};

// Birth
const birthSchema = new Schema({ ...regBase,
  childName: { type: String, required: true }, childNameNp: String,
  dateOfBirthBs: { type: String, required: true }, dateOfBirthAd: Date,
  gender: { type: String, required: true },
  fatherName: String, fatherCitizenshipNo: String,
  motherName: String, motherCitizenshipNo: String,
  fatherId: { type: Schema.Types.ObjectId, ref: "Citizen" },
  motherId: { type: Schema.Types.ObjectId, ref: "Citizen" },
  childId: { type: Schema.Types.ObjectId, ref: "Citizen" },
}, { timestamps: true });

// Death
const deathSchema = new Schema({ ...regBase,
  deceasedName: { type: String, required: true }, deceasedNameNp: String,
  dateOfDeathBs: { type: String, required: true }, dateOfDeathAd: Date,
  gender: String, ageAtDeath: String, causeOfDeath: String,
  informantName: String, informantRelation: String,
  citizenId: { type: Schema.Types.ObjectId, ref: "Citizen" },
}, { timestamps: true });

// Marriage
const marriageSchema = new Schema({ ...regBase,
  groomName: { type: String, required: true }, groomCitizenshipNo: String,
  brideName: { type: String, required: true }, brideCitizenshipNo: String,
  marriageDateBs: { type: String, required: true },
  marriageType: String, witnessName1: String, witnessName2: String,
  groomId: { type: Schema.Types.ObjectId, ref: "Citizen" },
  brideId: { type: Schema.Types.ObjectId, ref: "Citizen" },
}, { timestamps: true });

// Migration
const migrationSchema = new Schema({ ...regBase,
  citizenId: { type: Schema.Types.ObjectId, ref: "Citizen" },
  citizenName: { type: String, required: true },
  direction: { type: String, enum: ["in","out"], required: true },
  fromAddress: String, toAddress: String,
  fromWardId: { type: Schema.Types.ObjectId, ref: "Ward" },
  toWardId: { type: Schema.Types.ObjectId, ref: "Ward" },
  reason: String,
  migrationDateBs: { type: String, required: true },
}, { timestamps: true });

export const BirthRegistration = model("BirthRegistration", birthSchema);
export const DeathRegistration = model("DeathRegistration", deathSchema);
export const MarriageRegistration = model("MarriageRegistration", marriageSchema);
export const MigrationRegistration = model("MigrationRegistration", migrationSchema);
