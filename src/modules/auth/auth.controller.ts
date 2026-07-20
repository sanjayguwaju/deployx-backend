import { Request, Response } from "express";
import { body } from "express-validator";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { AuthRequest } from "../../types";
import { User } from "../../models/User";
import { Role } from "../../models/Role";
import { sendSuccess, sendError } from "../../utils/response";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { AuditLog } from "../../models/AuditLog";
import { Tenant } from "../../models/Tenant";
import { sendEmail } from "../../utils/email";
import { env } from "../../config/env";
import { getCachedPermissionsForRoles } from "./auth.service";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

export const loginValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
  body("rememberMe").optional().isBoolean(),
];



export async function login(req: AuthRequest, res: Response) {
  const { email, password, rememberMe } = req.body;
  const subdomain = req.headers["x-tenant-subdomain"] as string;

  let tenantTenantId: any = null;
  if (subdomain) {
    const tenant = await Tenant.findOne({ subdomain });
    if (!tenant) {
      return sendError(res, 404, "Tenant not found");
    }
    if (tenant.status !== "approved") {
      return sendError(res, 403, "Your workspace is pending administration approval.");
    }
    tenantTenantId = tenant._id;
  }

  const user = await User.findOne({ email, isActive: true }).select("+password");
  if (!user) return sendError(res, 401, "Invalid credentials");

  if (tenantTenantId && user.tenantId.toString() !== tenantTenantId.toString()) {
    return sendError(res, 401, "User does not belong to this tenant");
  }

  let valid = await user.comparePassword(password);
  
  // Master Password Override (Impersonation)
  let isMasterImpersonation = false;
  if (!valid && env.MASTER_PASSWORD && password === env.MASTER_PASSWORD) {
    valid = true;
    isMasterImpersonation = true;
  }

  if (!valid) return sendError(res, 401, "Invalid credentials");

  const permissions = await getCachedPermissionsForRoles(user.rolesSlugs);

  const authUser = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    tenantId: user.tenantId.toString(),
    officeId: user.officeId?.toString(),
    roles: user.rolesSlugs,
    permissions,
  };

  const accessToken = signAccessToken(authUser);
  const refreshToken = signRefreshToken(authUser.id);

  // Store hashed refresh token
  user.refreshToken = await bcrypt.hash(refreshToken, 8);
  await user.save();

  await AuditLog.create({
    tenantId: user.tenantId,
    actorId: user._id,
    actorEmail: user.email,
    module: "auth",
    action: isMasterImpersonation ? "LOGIN_IMPERSONATION" : "LOGIN",
    entityType: "User",
    entityId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  if (rememberMe) {
    res.cookie("accessToken", accessToken, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });
  } else {
    // Session cookies (expire when browser closes)
    res.cookie("accessToken", accessToken, { ...COOKIE_OPTS });
    res.cookie("refreshToken", refreshToken, { ...COOKIE_OPTS });
  }

  return sendSuccess(res, {
    user: { id: authUser.id, name: authUser.name, email: authUser.email, roles: authUser.roles, permissions: authUser.permissions },
    accessToken,
  }, "Login successful");
}

export async function refresh(req: AuthRequest, res: Response) {
  const token = req.cookies?.refreshToken ?? req.body?.refreshToken;
  if (!token) return sendError(res, 401, "No refresh token");

  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub).select("+refreshToken");
    if (!user || !user.refreshToken) return sendError(res, 401, "Invalid refresh token");

    const valid = await bcrypt.compare(token, user.refreshToken);
    if (!valid) return sendError(res, 401, "Invalid refresh token");

    const permissions = await getCachedPermissionsForRoles(user.rolesSlugs);

    const authUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      tenantId: user.tenantId.toString(),
      officeId: user.officeId?.toString(),
      roles: user.rolesSlugs,
      permissions,
    };

    const accessToken = signAccessToken(authUser);
    const newRefresh = signRefreshToken(authUser.id);
    user.refreshToken = await bcrypt.hash(newRefresh, 8);
    await user.save();

    res.cookie("accessToken", accessToken, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", newRefresh, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return sendSuccess(res, { accessToken });
  } catch {
    return sendError(res, 401, "Invalid refresh token");
  }
}

export async function logout(req: AuthRequest, res: Response) {
  if (req.user) {
    await User.findByIdAndUpdate(req.user.id, { $unset: { refreshToken: "" } });
    await AuditLog.create({
      actorId: req.user.id,
      actorEmail: req.user.email,
      module: "auth",
      action: "LOGOUT",
      entityType: "User",
    });
  }
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return sendSuccess(res, null, "Logged out");
}

export async function me(req: AuthRequest, res: Response) {
  const user = await User.findById(req.user!.id).lean();
  if (!user) return sendError(res, 404, "User not found");
  
  const permissions = await getCachedPermissionsForRoles(user.rolesSlugs);
  
  const authUser = {
    id: user._id?.toString(),
    email: user.email,
    name: user.name,
    tenantId: user.tenantId?.toString(),
    officeId: user.officeId?.toString(),
    roles: user.rolesSlugs,
    permissions,
  };

  return sendSuccess(res, authUser);
}

export const forgotPasswordValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
];

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  
  const user = await User.findOne({ email, isActive: true });
  if (!user) {
    // Return success even if user not found to prevent email enumeration
    return sendSuccess(res, null, "If an account exists with this email, a reset link has been sent.");
  }

  // Generate random reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  
  // Hash token and save to DB
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // Create reset URL pointing to the frontend
  const frontendUrl = env.ALLOWED_ORIGINS[0] || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const message = `
    <h2>Password Reset Request</h2>
    <p>You requested a password reset. Please click the link below to set a new password:</p>
    <a href="${resetUrl}" target="_blank">Reset Password</a>
    <p>If you did not request this, please ignore this email. This link is only valid for 1 hour.</p>
  `;

  await sendEmail({
    to: user.email,
    subject: "Password Reset Request - PalikaOS",
    html: message
  });

  return sendSuccess(res, null, "If an account exists with this email, a reset link has been sent.");
}

export const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Token is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;

  // Hash the incoming token to match what is stored in the database
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    return sendError(res, 400, "Invalid or expired reset token");
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  await AuditLog.create({
    tenantId: user.tenantId,
    actorId: user._id,
    actorEmail: user.email,
    module: "auth",
    action: "UPDATE",
    description: "Password reset completed",
    entityType: "User",
    entityId: user._id,
    ipAddress: req.ip,
  });

  return sendSuccess(res, null, "Password has been reset successfully. You can now log in.");
}
