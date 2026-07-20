import { Schema, model, Document, Types } from "mongoose";

export interface ITask extends Document {
  tenantId: Types.ObjectId;
  title: string;
  pipelineId?: Types.ObjectId; // Optional, might be tied to pipeline or general
  assignedTo: Types.ObjectId; // User
  dueDate?: Date;
  status: "pending" | "done";
  category: "passport_verification" | "medical" | "embassy" | "accounts" | "hr" | "operations";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    title: { type: String, required: true },
    pipelineId: { type: Schema.Types.ObjectId, ref: "Pipeline" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: Date,
    status: { type: String, enum: ["pending", "done"], default: "pending" },
    category: {
      type: String,
      enum: ["passport_verification", "medical", "embassy", "accounts", "hr", "operations"],
      required: true
    },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

taskSchema.index({ tenantId: 1, assignedTo: 1, status: 1 });
taskSchema.index({ pipelineId: 1 });

export const Task = model<ITask>("Task", taskSchema);
