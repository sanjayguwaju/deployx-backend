import { Request, Response } from "express";
import { WhatsappInstance } from "../../models/WhatsappInstance";
import axios from "axios";
import { AIService } from "../ai/ai.service";

// Evolution API configuration (ideally from environment variables)
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "global_api_key";

export const getStatus = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    let instance = await WhatsappInstance.findOne({ tenantId });
    if (!instance) {
      return res.status(200).json({ success: true, data: { status: "disconnected" } });
    }

    // Optionally ping Evolution API to check actual status
    try {
      const response = await axios.get(`${EVOLUTION_API_URL}/instance/connectionState/${instance.instanceName}`, {
        headers: { apikey: EVOLUTION_API_KEY }
      });
      
      const state = response.data?.instance?.state;
      if (state === "open") {
        instance.status = "connected";
      } else if (state === "connecting") {
        instance.status = "connecting";
      } else {
        instance.status = "disconnected";
      }
      await instance.save();
    } catch (e) {
      // If Evolution API is unreachable or instance doesn't exist there anymore
      console.warn("Failed to ping Evolution API", e);
    }

    return res.status(200).json({ success: true, data: instance });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createInstance = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const instanceName = `tenant-${tenantId.toString()}`;

    let instance = await WhatsappInstance.findOne({ tenantId });
    if (!instance) {
      instance = new WhatsappInstance({ tenantId, instanceName });
    }

    // Call Evolution API to create instance and request QR
    const response = await axios.post(
      `${EVOLUTION_API_URL}/instance/create`,
      {
        instanceName,
        qrcode: true,
        webhook: `${process.env.PUBLIC_URL || "http://localhost:3000"}/api/v1/whatsapp/webhook`,
        webhook_by_events: false,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
      },
      { headers: { apikey: EVOLUTION_API_KEY } }
    );

    const qrCodeUrl = response.data?.qrcode?.base64 || "";
    
    instance.status = "connecting";
    instance.qrCodeUrl = qrCodeUrl;
    await instance.save();

    return res.status(200).json({ success: true, data: { qrCodeUrl } });
  } catch (error: any) {
    console.error("Evolution API Create Error:", error?.response?.data || error);
    return res.status(500).json({ success: false, message: "Failed to connect to WhatsApp API" });
  }
};

export const logoutInstance = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const instance = await WhatsappInstance.findOne({ tenantId });
    if (!instance) return res.status(404).json({ success: false, message: "No instance found" });

    await axios.delete(`${EVOLUTION_API_URL}/instance/logout/${instance.instanceName}`, {
      headers: { apikey: EVOLUTION_API_KEY }
    });

    instance.status = "disconnected";
    instance.qrCodeUrl = "";
    instance.phoneNumber = "";
    await instance.save();

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to logout" });
  }
};

export const webhook = async (req: Request, res: Response) => {
  // Webhook receiver for Evolution API
  const payload = req.body;
  
  if (payload.event === "connection.update") {
    const { instance, state } = payload.data;
    const wp = await WhatsappInstance.findOne({ instanceName: instance });
    if (wp) {
      if (state === "open") wp.status = "connected";
      else if (state === "close") wp.status = "disconnected";
      await wp.save();
    }
  }

  if (payload.event === "messages.upsert") {
    // Phase 12: Chatbot Integration
    try {
      const messages = payload.data?.messages;
      if (messages && messages.length > 0) {
        for (const message of messages) {
          // Only process messages that are text from a remote JID (not from me)
          if (!message.key.fromMe && message.message?.conversation) {
            const phone = message.key.remoteJid.split('@')[0];
            const text = message.message.conversation;
            
            // Find the tenant associated with this instance
            const instanceName = payload.instance;
            const wp = await WhatsappInstance.findOne({ instanceName });
            if (wp && wp.tenantId) {
              await AIService.handleIncomingWhatsappMessage(wp.tenantId.toString(), phone, text);
            }
          }
        }
      }
    } catch (e) {
      console.error("Error processing AI Webhook", e);
    }
  }

  res.status(200).send("OK");
};
