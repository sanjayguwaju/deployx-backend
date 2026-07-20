import { Schema, model, Document, Types } from "mongoose";

export interface ISubscription extends Document {
  tenantId: Types.ObjectId;
  planId: Types.ObjectId;
  status: "trialing" | "active" | "past_due" | "cancelled";
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    status: { type: String, enum: ["trialing", "active", "past_due", "cancelled"], required: true },
    stripeSubscriptionId: String,
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true }
  },
  { timestamps: true }
);

subscriptionSchema.index({ tenantId: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

export const Subscription = model<ISubscription>("Subscription", subscriptionSchema);
