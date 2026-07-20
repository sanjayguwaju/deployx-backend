import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createUserValidation, listUsers, createUser, getUser, updateUser, deactivateUser, uploadProfileImage } from "./users.controller";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/profiles");
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "User"), listUsers);
router.post("/", authorize("create", "User"), createUserValidation, validate, createUser);
router.get("/:id", authorize("read", "User"), getUser);
router.put("/:id", authorize("update", "User"), updateUser);
router.post("/:id/upload", authorize("update", "User"), upload.single("image"), uploadProfileImage);
router.delete("/:id", authorize("delete", "User"), deactivateUser);

export default router;
