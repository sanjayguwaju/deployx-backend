import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listRoles, createRole, createRoleValidation, getRole, updateRole, deleteRole } from "./rbac.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "Role"), listRoles);
router.post("/", authorize("create", "Role"), createRoleValidation, validate, createRole);
router.get("/:id", authorize("read", "Role"), getRole);
router.put("/:id", authorize("update", "Role"), updateRole);
router.delete("/:id", authorize("delete", "Role"), deleteRole);

export default router;
