import { Request, Response } from "express";
import { AuthRequest } from "../../types";
import { sendSuccess, sendError } from "../../utils/response";
import { Subscription } from "../../models/Subscription";
import { Plan } from "../../models/Plan";
import { Payment } from "../../models/Payment";
import { env } from "../../config/env";
import crypto from "crypto";

export async function getMySubscription(req: AuthRequest, res: Response) {
  if (!req.user?.tenantId) return sendError(res, 401, "Unauthorized");

  const sub = await Subscription.findOne({ tenantId: req.user.tenantId }).sort({ createdAt: -1 });
  if (!sub) return sendSuccess(res, null, "No subscription found");

  return sendSuccess(res, sub);
}

export async function getAllSubscriptions(req: AuthRequest, res: Response) {
  // We assume authorizeRoles("platform_admin") is used on the route, but as a safeguard:
  if (!req.user?.roles?.includes("platform_admin")) {
    return sendError(res, 403, "Forbidden");
  }

  const subscriptions = await Subscription.find()
    .populate("tenantId", "name type province district")
    .sort({ createdAt: -1 });

  return sendSuccess(res, subscriptions);
}

export async function initiatePayment(req: AuthRequest, res: Response) {
  if (!req.user?.tenantId) return sendError(res, 401, "Unauthorized");
  
  const { planId, price } = req.body; // use planId
  
  // Create pending subscription if doesn't exist
  let sub = await Subscription.findOne({ tenantId: req.user.tenantId });
  if (!sub) {
    sub = await Subscription.create({
      tenantId: req.user.tenantId,
      planId,
      status: "trialing",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
    });
  }

  // Create pending payment record
  const payment = await Payment.create({
    tenantId: req.user.tenantId,
    subscriptionId: sub._id,
    amount: price,
    provider: "esewa",
    status: "pending",
  });

  // eSewa ePay details
  // Note: in production, secret should be from env. For testing: '8gBm/:&EnhH.1/q'
  const merchantId = env.ESEWA_MERCHANT_ID;
  const secret = env.ESEWA_SECRET; 
  
  const transactionUuid = payment._id.toString();
  const totalAmount = price;
  
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${merchantId}`;
  
  const signature = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("base64");

  const esewaPayload = {
    amount: price,
    tax_amount: 0,
    total_amount: totalAmount,
    transaction_uuid: transactionUuid,
    product_code: merchantId,
    product_service_charge: 0,
    product_delivery_charge: 0,
    success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/billing/verify`,
    failure_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/billing/verify`,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature,
  };

  return sendSuccess(res, { esewaPayload, url: "https://rc-epay.esewa.com.np/api/epay/main/v2/form" });
}

export async function verifyPayment(req: AuthRequest, res: Response) {
  // eSewa sends encoded payload via 'data' query param
  const encodedData = req.query.data as string;
  if (!encodedData) return sendError(res, 400, "Invalid payload");

  try {
    const decodedStr = Buffer.from(encodedData, "base64").toString("utf8");
    const parsedData = JSON.parse(decodedStr);
    
    // Validate eSewa Signature here in production!
    // We trust it for this prototype demonstration.
    
    const payment = await Payment.findById(parsedData.transaction_uuid);
    if (!payment) return sendError(res, 404, "Payment not found");

    if (parsedData.status === "COMPLETE") {
      payment.status = "completed";
      payment.transactionId = parsedData.transaction_code;
      payment.paymentDate = new Date();
      await payment.save();

      const sub = await Subscription.findById(payment.subscriptionId);
      if (sub) {
        sub.status = "active";
        sub.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // add 1 year
        await sub.save();
      }

      return sendSuccess(res, null, "Payment verified successfully");
    } else {
      payment.status = "failed";
      await payment.save();
      return sendError(res, 400, "Payment failed");
    }
  } catch (error) {
    return sendError(res, 500, "Error verifying payment");
  }
}
