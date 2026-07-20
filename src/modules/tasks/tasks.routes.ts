import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { 
  listTasks, 
  createTask, 
  getTask, 
  updateTask, 
  deleteTask,
  markTaskDone,
  taskValidation 
} from "./tasks.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "Task"), listTasks);
router.post("/", authorize("create", "Task"), taskValidation, validate, createTask);
router.get("/:id", authorize("read", "Task"), getTask);
router.put("/:id", authorize("update", "Task"), updateTask);
router.delete("/:id", authorize("delete", "Task"), deleteTask);
router.patch("/:id/done", authorize("update", "Task"), markTaskDone);

export default router;
