import axios from "axios";
import { WhatsappInstance } from "../models/WhatsappInstance";
import logger from "../config/logger";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "global_api_key";

export class WhatsappService {
  /**
   * Sends a WhatsApp text message to a specific phone number using the agency's connected instance.
   */
  static async sendTextMessage(tenantId: string, phone: string, text: string) {
    if (!phone) return false;
    
    try {
      const wp = await WhatsappInstance.findOne({ tenantId, status: "connected" });
      if (!wp) {
        logger.warn(`No connected WhatsApp instance found for tenant ${tenantId}`);
        return false;
      }
      
      // Format phone number to international format, assuming Nepal +977 or UAE etc.
      // Strip any non-numeric characters
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      
      await axios.post(
        `${EVOLUTION_API_URL}/message/sendText/${wp.instanceName}`,
        {
          number: cleanPhone,
          options: { delay: 1200, presence: "composing" },
          textMessage: { text }
        },
        { headers: { apikey: EVOLUTION_API_KEY } }
      );
      
      logger.info(`WhatsApp message sent to ${cleanPhone}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send WhatsApp to ${phone}`, error);
      return false;
    }
  }
}
