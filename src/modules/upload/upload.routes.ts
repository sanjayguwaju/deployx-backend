import { Router } from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { s3Client } from "../../config/s3";
import { uploadFile } from "./upload.controller";

const router = Router();

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME || "palika-os",
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req: any, file: any, cb: any) {
      const subdomain = req.headers["x-tenant-subdomain"] || "global";
      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;
      cb(null, `${subdomain}/uploads/${filename}`);
    },
  }),
  limits: {
    fileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    // Check if the file is an image
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed (JPEG, PNG, WebP, etc.)."));
    }
  },
});

// Since upload route might just be authenticated, we assume protect middleware is added at app.ts level or here
router.post("/", upload.single("file"), uploadFile);

export default router;
