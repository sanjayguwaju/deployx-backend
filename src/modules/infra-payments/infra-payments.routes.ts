import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { createInfraPayment, getInfraPayments, processPaidPayment } from "./infra-payments.controller";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post("/", authorize("create", "InfraPayment"), createInfraPayment);
router.get("/", authorize("read", "InfraPayment"), getInfraPayments);
router.post("/:id/pay", authorize("update", "InfraPayment"), processPaidPayment);

export default router;
