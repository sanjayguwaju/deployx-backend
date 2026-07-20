import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import { Role } from "../../models/Role";
import { sendSuccess, sendError } from "../../utils/response";
import { redis } from "../../config/redis";

export const createRoleValidation = [
  body("name").notEmpty().trim(),
  body("slug").notEmpty().trim().toLowerCase(),
  body("permissions").isArray(),
  body("permissions.*.module").notEmpty(),
  body("permissions.*.action").isIn(["create","read","update","delete","approve","export","manage"]),
];

export async function listRoles(req: AuthRequest, res: Response) {
  const roles = await Role.find({
    $or: [
      { tenantId: req.user!.tenantId },
      { tenantId: null },
    ],
  });
  return sendSuccess(res, roles);
}

export async function createRole(req: AuthRequest, res: Response) {
  const { name, nameNp, slug, description, permissions, level } = req.body;
  const existing = await Role.findOne({ slug, tenantId: req.user!.tenantId });
  if (existing) return sendError(res, 409, "Role with this slug already exists");
  const role = await Role.create({
    name, nameNp, slug, description, permissions, level,
    tenantId: req.user!.tenantId,
  });
  return sendSuccess(res, role, "Role created", 201);
}

export async function getRole(req: AuthRequest, res: Response) {
  const role = await Role.findById(req.params.id);
  if (!role) return sendError(res, 404, "Role not found");
  return sendSuccess(res, role);
}

export async function updateRole(req: AuthRequest, res: Response) {
  const role = await Role.findById(req.params.id);
  if (!role) return sendError(res, 404, "Role not found");
  
  if (role.isSystem) {
    // For system roles, only allow updating permissions, description, and level
    if (req.body.permissions) role.permissions = req.body.permissions;
    if (req.body.description !== undefined) role.description = req.body.description;
    if (req.body.level !== undefined) role.level = req.body.level;
  } else {
    // Normal role update
    Object.assign(role, req.body);
  }
  
  await role.save();
  await redis.del(`permissions:role:${role.slug}`);
  return sendSuccess(res, role, "Role updated");
}

export async function deleteRole(req: AuthRequest, res: Response) {
  const role = await Role.findOne({ _id: req.params.id, isSystem: false });
  if (!role) return sendError(res, 404, "Role not found or cannot delete system role");
  await role.deleteOne();
  await redis.del(`permissions:role:${role.slug}`);
  return sendSuccess(res, null, "Role deleted");
}
