import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export function GlobalExceptionHandler(
  err: Error & { status?: number; statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status = err.status ?? err.statusCode ?? 500;
  if (status >= 500) logger.error("Unhandled error:", err);
  res.status(status).json({
    success: false,
    message: status >= 500 ? "Internal server error" : err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
