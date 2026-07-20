import { Schema, model, Document, Types } from "mongoose";

export interface ITenant extends Document {
  name: string;
  nameNp?: string;
  code: string;
  subdomain: string;
  district?: string;
  province?: string;
  type: "rural" | "urban" | "sub-metropolitan" | "metropolitan";
  totalOffices: number;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
  themeConfig?: {
    primaryColor: string;
  };
  portalSettings?: {
    agentLeaderboardEnabled: boolean;
  };
  isActive: boolean;
  status: "trial" | "active" | "suspended" | "cancelled" | "pending" | "approved" | "rejected"; // Merged legacy + SaaS
  plan?: "starter" | "professional" | "enterprise";
  trialEndsAt?: Date;
  billing?: {
    stripeCustomerId?: string;
    currentPeriodEnd?: Date;
  };
  featureFlags?: {
    aiLayer: boolean;
    whiteLabel: boolean;
    apiAccess: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true },
    nameNp: String,
    code: { type: String, required: true, unique: true, uppercase: true },
    subdomain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    district: String,
    province: String,
    type: { type: String, enum: ["rural","urban","sub-metropolitan","metropolitan"], default: "rural" },
    totalOffices: { type: Number, default: 9 },
    contactEmail: String,
    contactPhone: String,
    address: String,
    logoUrl: String,
    themeConfig: {
      primaryColor: { type: String, default: "#1C2434" } // Default tailwind brand color (or any specific hex)
    },
    portalSettings: {
      agentLeaderboardEnabled: { type: Boolean, default: false }
    },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["trial", "active", "suspended", "cancelled", "pending", "approved", "rejected"], default: "trial" },
    plan: { type: String, enum: ["starter", "professional", "enterprise"], default: "starter" },
    trialEndsAt: Date,
    billing: {
      stripeCustomerId: String,
      currentPeriodEnd: Date
    },
    featureFlags: {
      aiLayer: { type: Boolean, default: false },
      whiteLabel: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false }
    }
  },
  { timestamps: true },
);

export const Tenant = model<ITenant>("Tenant", tenantSchema);
