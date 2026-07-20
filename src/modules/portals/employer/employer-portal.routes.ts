import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/authorize.middleware";
import { 
  getEmployerDemands, 
  getEmployerPipeline, 
  getEmployerInvoices, 
  counterSignAgreement 
} from "./employer-portal.controller";

const router = Router();
router.use(authenticate);
// Ensure only users with employer portal access can hit these routes
router.use(authorize("read", "EmployerPortal"));

router.get("/demands", getEmployerDemands);
router.get("/demands/:id/pipeline", getEmployerPipeline);
router.get("/invoices", getEmployerInvoices);
router.post("/agreements/:id/counter-sign", counterSignAgreement);

export default router;
