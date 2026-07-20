import Queue from "bull";
import { env } from "../config/env";
import logger from "../config/logger";
import { Medical } from "../models/Medical";
import { Visa } from "../models/Visa";
import { License } from "../models/License";

const expiryQueue = new Queue("expiry-jobs", {
  redis: env.REDIS_URL,
});

// Run daily at midnight
expiryQueue.add(
  "daily-expiry-check",
  {},
  { repeat: { cron: "0 0 * * *" } }
);

expiryQueue.process("daily-expiry-check", async (job) => {
  logger.info("Running daily expiry check for Medical and Visa records");

  const today = new Date();
  const warningDate = new Date();
  warningDate.setDate(today.getDate() + 30); // 30 days warning

  // 1. Check Medical
  const expiringMedical = await Medical.find({
    isDeleted: false,
    expiryDate: { $lte: warningDate, $gt: today },
  }).populate("candidateId", "firstName lastName");

  expiringMedical.forEach(m => {
    logger.info(`[Notification] Medical record for candidate ${m.candidateId} is expiring on ${m.expiryDate}`);
  });

  // 2. Check Visa
  const expiringVisa = await Visa.find({
    isDeleted: false,
    expiryDate: { $lte: warningDate, $gt: today },
  }).populate("candidateId", "firstName lastName");

  expiringVisa.forEach(v => {
    logger.info(`[Notification] Visa for candidate ${v.candidateId} is expiring on ${v.expiryDate}`);
  });

  // 3. Check Licenses
  const expiringLicenses = await License.find({
    status: "active",
    expiryDate: { $lte: warningDate, $gt: today },
  });

  expiringLicenses.forEach(l => {
    logger.info(`[Notification] Agency License ${l.licenseType} (${l.licenseNumber}) is expiring on ${l.expiryDate}`);
  });

  return { medicalCount: expiringMedical.length, visaCount: expiringVisa.length, licenseCount: expiringLicenses.length };
});

expiryQueue.on("error", (error) => {
  logger.error("Expiry Queue Error:", error);
});

expiryQueue.on("completed", (job, result) => {
  logger.info(`Daily expiry check completed. Found ${result.medicalCount} medical, ${result.visaCount} visa, and ${result.licenseCount} license expiring records.`);
});

export default expiryQueue;
