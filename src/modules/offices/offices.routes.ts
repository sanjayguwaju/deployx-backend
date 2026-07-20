import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listOffices, createOffice, wardValidation, getOffice, updateOffice } from "./offices.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "Office"), listOffices);
router.post("/", authorize("create", "Office"), wardValidation, validate, createOffice);
router.get("/:id", authorize("read", "Office"), getOffice);
router.put("/:id", authorize("update", "Office"), updateOffice);

export default router;
