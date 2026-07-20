import { Schema, model, Document, Types } from "mongoose";

export interface IInfraProject extends Document {
  municipalityId: Types.ObjectId;
  wardId?: Types.ObjectId;
  name: string;
  nameNp?: string;
  budget?: number;
  contractor?: string;
  status: "planned" | "ongoing" | "completed" | "delayed";
  startDateBs?: string;
  expectedEndDateBs?: string;
  budgetAllocationId?: Types.ObjectId;
  percentComplete: number;
  contractorContact?: string;
  
  // Basic Identifiers
  fiscalYear?: string;
  registrationNumber?: string;
  projectSector?: "capital" | "recurrent";
  
  // Execution Mechanism
  implementationMedium?: "upabhokta_samiti" | "contractor" | "amanat";
  committeeContractorName?: string;
  
  // Budget Breakdown
  municipalityBudget?: number;
  costSharingBudget?: number;
  contingencyBudget?: number;
  
  // Dates & Milestones
  agreementDateBs?: string;
  targetCompletionDateBs?: string;
  
  // Beneficiaries & Targets
  targetedGroup?: string;
  benefitedHouseholds?: number;
  
  // Monitoring & Installments
  paymentStatus?: "advance" | "first_installment" | "final_payment";
  monitoringCommittee?: string;

  isDeleted: boolean;
}

const infraProjectSchema = new Schema<IInfraProject>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    wardId: { type: Schema.Types.ObjectId, ref: "Ward" },
    name: { type: String, required: true },
    nameNp: String,
    budget: Number,
    contractor: String,
    status: {
      type: String,
      enum: ["planned", "ongoing", "completed", "delayed"],
      default: "planned",
    },
    startDateBs: String,
    expectedEndDateBs: String,
    budgetAllocationId: { type: Schema.Types.ObjectId, ref: "BudgetAllocation" },
    percentComplete: { type: Number, default: 0, min: 0, max: 100 },
    contractorContact: String,

    // Basic Identifiers
    fiscalYear: String,
    registrationNumber: String,
    projectSector: { type: String, enum: ["capital", "recurrent"] },

    // Execution Mechanism
    implementationMedium: { type: String, enum: ["upabhokta_samiti", "contractor", "amanat"] },
    committeeContractorName: String,

    // Budget Breakdown
    municipalityBudget: { type: Number, default: 0 },
    costSharingBudget: { type: Number, default: 0 },
    contingencyBudget: { type: Number, default: 0 },

    // Dates & Milestones
    agreementDateBs: String,
    targetCompletionDateBs: String,

    // Beneficiaries & Targets
    targetedGroup: String,
    benefitedHouseholds: { type: Number, default: 0 },

    // Monitoring & Installments
    paymentStatus: { type: String, enum: ["advance", "first_installment", "final_payment"] },
    monitoringCommittee: String,

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

infraProjectSchema.index({ municipalityId: 1, status: 1 });
infraProjectSchema.index({ municipalityId: 1, isDeleted: 1 });

export const InfraProject = model<IInfraProject>("InfraProject", infraProjectSchema);
