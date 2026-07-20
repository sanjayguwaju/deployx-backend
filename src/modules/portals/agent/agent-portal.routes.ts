import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/authorize.middleware";
import { 
  getAgentCandidates, 
  getAgentCommissions, 
  getAgentLeaderboard, 
  submitReferral 
} from "./agent-portal.controller";

const router = Router();
router.use(authenticate);
router.use(authorize("read", "AgentPortal"));

router.get("/candidates", getAgentCandidates);
router.get("/commissions", getAgentCommissions);
router.get("/leaderboard", getAgentLeaderboard);
router.post("/referrals", submitReferral);

export default router;
