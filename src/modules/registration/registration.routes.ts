import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { birthHandlers, deathHandlers, marriageHandlers, migrationHandlers } from "./registration.controller";

const router = Router();
router.use(authenticate);

// Birth
router.get("/birth", authorize("read", "Registration"), birthHandlers.list);
router.post("/birth", authorize("create", "Registration"), birthHandlers.create);
router.get("/birth/:id", authorize("read", "Registration"), birthHandlers.getOne);
router.put("/birth/:id", authorize("update", "Registration"), birthHandlers.update);
router.delete("/birth/:id", authorize("delete", "Registration"), birthHandlers.delete);
router.patch("/birth/:id/verify", authorize("approve", "Registration"), birthHandlers.verify);

// Death
router.get("/death", authorize("read", "Registration"), deathHandlers.list);
router.post("/death", authorize("create", "Registration"), deathHandlers.create);
router.get("/death/:id", authorize("read", "Registration"), deathHandlers.getOne);
router.put("/death/:id", authorize("update", "Registration"), deathHandlers.update);
router.delete("/death/:id", authorize("delete", "Registration"), deathHandlers.delete);
router.patch("/death/:id/verify", authorize("approve", "Registration"), deathHandlers.verify);

// Marriage
router.get("/marriage", authorize("read", "Registration"), marriageHandlers.list);
router.post("/marriage", authorize("create", "Registration"), marriageHandlers.create);
router.get("/marriage/:id", authorize("read", "Registration"), marriageHandlers.getOne);
router.put("/marriage/:id", authorize("update", "Registration"), marriageHandlers.update);
router.delete("/marriage/:id", authorize("delete", "Registration"), marriageHandlers.delete);
router.patch("/marriage/:id/verify", authorize("approve", "Registration"), marriageHandlers.verify);

// Migration
router.get("/migration", authorize("read", "Registration"), migrationHandlers.list);
router.post("/migration", authorize("create", "Registration"), migrationHandlers.create);
router.get("/migration/:id", authorize("read", "Registration"), migrationHandlers.getOne);
router.put("/migration/:id", authorize("update", "Registration"), migrationHandlers.update);
router.delete("/migration/:id", authorize("delete", "Registration"), migrationHandlers.delete);
router.patch("/migration/:id/verify", authorize("approve", "Registration"), migrationHandlers.verify);

export default router;
