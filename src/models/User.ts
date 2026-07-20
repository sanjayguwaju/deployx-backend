import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";
import { SystemRole } from "../types";

export interface IUser extends Document {
  tenantId: Types.ObjectId;
  officeId?: Types.ObjectId;
  employerId?: Types.ObjectId; // Phase 4
  candidateId?: Types.ObjectId; // Phase 4
  name: string;
  nameNp?: string;
  email: string;
  password: string;
  phone?: string;
  image?: string;
  employeeId?: string;
  designation?: string;
  roles: Types.ObjectId[]; // refs to Role
  rolesSlugs: SystemRole[]; // denormalised for fast JWT embed
  isActive: boolean;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  country?: string;
  cityState?: string;
  postalCode?: string;
  taxId?: string;
  bio?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    officeId: { type: Schema.Types.ObjectId, ref: "Office" },
    employerId: { type: Schema.Types.ObjectId, ref: "Employer" },
    candidateId: { type: Schema.Types.ObjectId, ref: "Candidate" },
    name: { type: String, required: true },
    nameNp: String,
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    phone: String,
    image: String,
    employeeId: String,
    designation: String,
    roles: [{ type: Schema.Types.ObjectId, ref: "Role" }],
    rolesSlugs: [{ type: String }],
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    country: String,
    cityState: String,
    postalCode: String,
    taxId: String,
    bio: String,
    socialLinks: {
      facebook: String,
      twitter: String,
      linkedin: String,
      instagram: String,
    }
  },
  { timestamps: true },
);

userSchema.index({ tenantId: 1, email: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>("User", userSchema);
