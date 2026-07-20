import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { initiatePayment, verifyPayment, getMySubscription, getAllSubscriptions } from "./subscriptions.controller";

const router = Router();

router.use(authenticate);

router.get("/my", getMySubscription);
router.get("/all", getAllSubscriptions);
router.post("/initiate-payment", initiatePayment);
router.get("/verify-payment", verifyPayment); // Often a GET redirect from eSewa

export default router;
