import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseInt(process.env.PORT ?? "4000", 10),
  MONGODB_URI: process.env.MONGODB_URI ?? "mongodb://localhost:27017/palikaos",
  JWT_SECRET: process.env.JWT_SECRET ?? "change-me-secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "change-me-refresh",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  MASTER_PASSWORD: process.env.MASTER_PASSWORD ?? "",
  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST ?? "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT ?? "6379", 10),
  SMTP_HOST: process.env.SMTP_HOST ?? "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT ?? "587", 10),
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",
  SMS_API_URL: process.env.SMS_API_URL ?? "",
  SMS_TOKEN: process.env.SMS_TOKEN ?? "",
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000").split(","),
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB ?? "10", 10),
  ESEWA_MERCHANT_ID: process.env.ESEWA_MERCHANT_ID ?? "EPAYTEST",
  ESEWA_SECRET: process.env.ESEWA_SECRET ?? "8gBm/:&EnhH.1/q",
};
