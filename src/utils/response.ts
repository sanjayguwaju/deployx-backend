import { Response } from "express";
import { ApiResponse } from "../types";

export function sendSuccess<T>(res: Response, data: T, message?: string, status = 200) {
  const body: ApiResponse<T> = { success: true, data, message };
  return res.status(status).json(body);
}

export function sendError(res: Response, status: number, message: string, errors?: unknown[]) {
  const body: ApiResponse = { success: false, message, errors };
  return res.status(status).json(body);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return res.json({
    success: true,
    data,
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
}
