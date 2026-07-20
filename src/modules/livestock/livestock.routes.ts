import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listLivestockRecords, createLivestockRecord, getLivestockRecord, updateLivestockRecord, deleteLivestockRecord, livestockValidation } from "./livestock.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "LivestockRecord"), listLivestockRecords);
router.post("/", authorize("create", "LivestockRecord"), livestockValidation, validate, createLivestockRecord);
router.get("/:id", authorize("read", "LivestockRecord"), getLivestockRecord);
router.put("/:id", authorize("update", "LivestockRecord"), updateLivestockRecord);
router.delete("/:id", authorize("delete", "LivestockRecord"), deleteLivestockRecord);

export default router;
