import { Response } from "express";
import { body, param, query } from "express-validator";
import { AuthRequest } from "../../types";
import { User } from "../../models/User";
import { Role } from "../../models/Role";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import mongoose from "mongoose";

export const createUserValidation = [
  body("name").notEmpty().trim(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }),
  body("roleIds").isArray({ min: 1 }),
  body("officeId").optional().isMongoId(),
];

export async function listUsers(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");
  const search = req.query.search as string;

  const filter: Record<string, unknown> = { tenantId: req.user!.tenantId };
  if (search) filter.$or = [
    { name: { $regex: search, $options: "i" } },
    { email: { $regex: search, $options: "i" } },
  ];

  const [data, total] = await Promise.all([
    User.find(filter).populate("roles", "name slug").skip((page - 1) * pageSize).limit(pageSize),
    User.countDocuments(filter),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function createUser(req: AuthRequest, res: Response) {
  const { name, email, password, roleIds, officeId, designation, employeeId, phone, nameNp } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return sendError(res, 409, "Email already in use");

  const roles = await Role.find({ _id: { $in: roleIds } });
  const rolesSlugs = roles.map((r) => r.slug) as any;

  const user = await User.create({
    name, email, password, nameNp, phone, designation, employeeId,
    tenantId: req.user!.tenantId,
    officeId: officeId || undefined,
    roles: roleIds,
    rolesSlugs,
  });

  return sendSuccess(res, { id: user._id, name: user.name, email: user.email }, "User created", 201);
}

export async function getUser(req: AuthRequest, res: Response) {
  const user = await User.findOne({
    _id: req.params.id,
    tenantId: req.user!.tenantId,
  }).populate("roles", "name slug permissions");
  if (!user) return sendError(res, 404, "User not found");
  return sendSuccess(res, user);
}

export async function updateUser(req: AuthRequest, res: Response) {
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId },
    { $set: req.body },
    { new: true },
  );
  if (!user) return sendError(res, 404, "User not found");
  return sendSuccess(res, user, "User updated");
}

export async function deactivateUser(req: AuthRequest, res: Response) {
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId },
    { isActive: false },
    { new: true },
  );
  if (!user) return sendError(res, 404, "User not found");
  return sendSuccess(res, null, "User deactivated");
}

export async function uploadProfileImage(req: AuthRequest, res: Response) {
  if (!req.file) return sendError(res, 400, "No image file provided");
  const imageUrl = `/uploads/profiles/${req.file.filename}`;
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId },
    { image: imageUrl },
    { new: true }
  );
  if (!user) return sendError(res, 404, "User not found");
  return sendSuccess(res, user, "Profile image updated");
}
