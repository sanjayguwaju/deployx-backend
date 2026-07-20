import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { getTicketByPipeline, createOrUpdateTicket } from "./ticket.controller";

const router = Router();
router.use(authenticate);

router.get("/pipeline/:pipelineId", authorize("read", "Ticket"), getTicketByPipeline);
router.post("/", authorize("create", "Ticket"), createOrUpdateTicket);

export default router;
