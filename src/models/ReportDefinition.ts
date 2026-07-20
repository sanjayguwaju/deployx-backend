import { Schema, model, Document, Types } from "mongoose";

export interface IFilterSchema {
  field: string;
  type: "string" | "number" | "date" | "boolean" | "enum";
  operatorOptions: string[]; // e.g. ["eq", "gt", "lt", "in"]
}

export interface IColumnSchema {
  field: string;
  label: string;
  format?: string; // e.g. "currency", "date", "percentage"
}

export interface IReportDefinition extends Document {
  tenantId: Types.ObjectId;
  name: string;
  description: string;
  category: string;
  baseEntity: "Candidate" | "Demand" | "Pipeline" | "Invoice" | "Commission" | "Expense";
  filtersSchema: IFilterSchema[];
  columns: IColumnSchema[];
  defaultSort?: string;
  defaultGroupBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportDefinitionSchema = new Schema<IReportDefinition>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    description: String,
    category: { type: String, required: true },
    baseEntity: { 
      type: String, 
      enum: ["Candidate", "Demand", "Pipeline", "Invoice", "Commission", "Expense"], 
      required: true 
    },
    filtersSchema: [{
      field: String,
      type: { type: String, enum: ["string", "number", "date", "boolean", "enum"] },
      operatorOptions: [String]
    }],
    columns: [{
      field: String,
      label: String,
      format: String
    }],
    defaultSort: String,
    defaultGroupBy: String
  },
  { timestamps: true }
);

reportDefinitionSchema.index({ tenantId: 1, category: 1 });

export const ReportDefinition = model<IReportDefinition>("ReportDefinition", reportDefinitionSchema);
