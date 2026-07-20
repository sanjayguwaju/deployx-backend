import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { 
  listDemands, 
  createDemand, 
  getDemand, 
  updateDemand, 
  deleteDemand,
  approveDemand,
  rejectDemand,
  demandValidation 
} from "./demands.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "Demand"), listDemands);
router.post("/", authorize("create", "Demand"), demandValidation, validate, createDemand);
router.get("/:id", authorize("read", "Demand"), getDemand);
router.put("/:id", authorize("update", "Demand"), updateDemand);
router.delete("/:id", authorize("delete", "Demand"), deleteDemand);

router.post("/:id/approve", authorize("approve", "Demand"), approveDemand);
router.post("/:id/reject", authorize("approve", "Demand"), rejectDemand);

export default router;
