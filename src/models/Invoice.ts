import { Schema, model, Document, Types } from "mongoose";

export interface IInvoiceLineItem {
  description: string;
  amount: number;
  refType?: string; // e.g. "Candidate", "Demand"
  refId?: Types.ObjectId;
}

export interface IInvoice extends Document {
  tenantId: Types.ObjectId;
  invoiceNumber: string;
  billedToType: "employer" | "candidate";
  billedToId: Types.ObjectId;
  lineItems: IInvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate?: Date;
  paidAt?: Date;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    invoiceNumber: { type: String, required: true },
    billedToType: { type: String, enum: ["employer", "candidate"], required: true },
    billedToId: { type: Schema.Types.ObjectId, required: true },
    lineItems: [{
      description: { type: String, required: true },
      amount: { type: Number, required: true },
      refType: String,
      refId: Schema.Types.ObjectId
    }],
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "USD" },
    status: { 
      type: String, 
      enum: ["draft", "sent", "paid", "overdue", "cancelled"], 
      default: "draft" 
    },
    dueDate: Date,
    paidAt: Date,
    paymentMethod: String,
  },
  { timestamps: true }
);

invoiceSchema.index({ tenantId: 1, billedToId: 1 });
invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });

export const Invoice = model<IInvoice>("Invoice", invoiceSchema);
