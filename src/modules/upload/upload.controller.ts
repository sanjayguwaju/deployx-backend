import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../utils/response";

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 400, "No file uploaded.");
    }

    const file = req.file as Express.MulterS3.File;
    
    // The public URL can be constructed if using Cloudflare R2 / S3 standard bucket
    let publicUrl = file.location;
    if (process.env.S3_PUBLIC_URL) {
      // Use custom domain for public access
      publicUrl = `${process.env.S3_PUBLIC_URL}/${file.key}`;
    }

    return sendSuccess(res, {
      url: publicUrl,
      key: file.key,
      size: file.size,
      mimetype: file.mimetype,
    }, "File uploaded successfully.");
  } catch (error: any) {
    return sendError(res, 500, error.message || "Failed to upload file.");
  }
};
