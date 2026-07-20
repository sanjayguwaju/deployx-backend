import rateLimit from "express-rate-limit";

export const publicRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many auth attempts, try again in 15 minutes" },
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});
