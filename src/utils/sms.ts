import axios from "axios";
import logger from "../config/logger";

export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    // In production, configure actual SMS gateway (e.g. Sparrow SMS, Aakash SMS)
    const smsToken = process.env.SMS_API_TOKEN || "test_token";
    const smsUrl = process.env.SMS_API_URL || "https://api.sparrowsms.com/v2/sms/";
    
    // For local development or if token is missing, just log the SMS
    if (!process.env.SMS_API_TOKEN) {
      logger.info(`[SMS MOCK] To: ${to} | Message: ${message}`);
      return true;
    }

    const response = await axios.post(smsUrl, {
      token: smsToken,
      from: "PalikaOS",
      to,
      text: message
    });

    if (response.status === 200) {
      logger.info(`SMS sent successfully to ${to}`);
      return true;
    }
    
    logger.error(`SMS Provider returned non-200 status: ${response.status}`);
    return false;
  } catch (error: any) {
    logger.error(`Failed to send SMS to ${to}: ${error.message}`);
    return false;
  }
}
