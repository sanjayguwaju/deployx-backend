// Mock implementation of Claude API integrations for MVP
import { Candidate } from "../../models/Candidate";
import { Pipeline } from "../../models/Pipeline";
import { WhatsappService } from "../../utils/whatsapp.service";

export class AIService {
  
  /**
   * Mocks embedding generation and vector similarity.
   * In production, this would call Claude API to extract skills and compute cosine similarity.
   */
  static async getMatches(entityId: string, entityType: "candidate" | "demand") {
    // Stub: Returns mock matches with realistic scores
    if (entityType === "candidate") {
      return [
        { demandId: "mock_demand_1", matchScore: 92, missingSkills: ["Arabic Language"] },
        { demandId: "mock_demand_2", matchScore: 85, missingSkills: ["Heavy License", "First Aid"] },
        { demandId: "mock_demand_3", matchScore: 71, missingSkills: ["Forklift Operation"] }
      ];
    } else {
      return [
        { candidateId: "mock_candidate_1", matchScore: 95, missingSkills: [] },
        { candidateId: "mock_candidate_2", matchScore: 88, missingSkills: ["Arabic Language"] }
      ];
    }
  }

  /**
   * Mocks Claude Vision OCR extraction from a document URL.
   */
  static async extractDocumentData(documentUrl: string, expectedType: string) {
    // Stub: Return mock structured JSON based on document type
    switch (expectedType.toLowerCase()) {
      case "passport":
        return {
          documentType: "Passport",
          extractedData: {
            name: "JOHN DOE",
            passportNumber: "A12345678",
            dob: "1990-01-01",
            nationality: "NPL",
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split('T')[0]
          },
          confidence: 0.98
        };
      case "visa":
        return {
          documentType: "Visa",
          extractedData: {
            visaNumber: "V987654321",
            sponsor: "GLOBAL HOLDINGS LLC",
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0]
          },
          confidence: 0.95
        };
      default:
        return {
          documentType: expectedType,
          extractedData: {
            notes: "Raw text extraction placeholder."
          },
          confidence: 0.75
        };
    }
  }

  /**
   * Mocks Claude NLP intent parsing.
   * Maps natural language strings to secure, pre-defined system intents.
   */
  static async parseAssistantIntent(query: string) {
    const q = query.toLowerCase();
    
    if (q.includes("ready") || q.includes("deployment")) {
      return {
        intent: "candidate_lookup",
        filters: { stage: "deployment_ready" },
        summary: "Here are the candidates currently ready for deployment."
      };
    }
    
    if (q.includes("expire") || q.includes("passport")) {
      return {
        intent: "expiry_lookup",
        filters: { documentType: "passport" },
        summary: "I found the following candidates with expiring passports."
      };
    }

    if (q.includes("invoice") || q.includes("generate")) {
      return {
        intent: "generate_invoice",
        requiresConfirmation: true, // Write actions MUST require confirmation
        summary: "You are about to generate an invoice. Please confirm this action."
      };
    }

    if (q.includes("revenue") || q.includes("summarize")) {
      return {
        intent: "revenue_summary",
        filters: {},
        summary: "Here is the summary of the revenue metrics."
      };
    }

    // Fallback
    return {
      intent: "unknown",
      filters: {},
      summary: "I couldn't perfectly understand that request. Could you rephrase it?"
    };
  }

  /**
   * Mocks verification heuristics (duplicate checking, blurriness).
   */
  static async runVerificationChecks(candidateId: string) {
    // Stub
    return {
      status: "requires_review",
      flags: [
        { type: "duplicate_warning", message: "Passport number matches an existing inactive record." },
        { type: "quality_warning", message: "The uploaded visa scan is blurry. Consider re-uploading." }
      ],
      missingDocuments: ["Medical Report"]
    };
  }

  /**
   * Phase 12: WhatsApp Chatbot Logic
   * Handles incoming text from a candidate, resolves identity, gathers context, and sends a reply.
   */
  static async handleIncomingWhatsappMessage(tenantId: string, phone: string, message: string) {
    // 1. Identity Resolution
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    
    // We try to find a candidate that has this phone number
    // Note: Phone numbers in DB might be formatted differently, using regex or partial match for MVP
    const candidate = await Candidate.findOne({ 
      tenantId, 
      phone: { $regex: new RegExp(cleanPhone.slice(-10) + "$", "i") } 
    });

    let responseText = "Hello! I am the agency's virtual assistant. We have received your message and an agent will contact you shortly.";

    if (candidate) {
      // 2. Context Gathering
      const pipeline = await Pipeline.findOne({ candidateId: candidate._id, tenantId }).sort("-createdAt");
      
      // 3. Intent Parsing (Smart Template Engine)
      const q = message.toLowerCase();
      
      if (q.includes("status")) {
        if (pipeline) {
          responseText = `Hello ${candidate.firstName}, your current application status is: *${pipeline.stage.toUpperCase()}*. We will update you when there is progress.`;
        } else {
          responseText = `Hello ${candidate.firstName}, your profile is registered but you haven't been assigned to a job demand yet.`;
        }
      } 
      else if (q.includes("document") || q.includes("missing")) {
        responseText = `Hello ${candidate.firstName}, please ensure you have submitted your valid Passport, Medical Report, and Police Clearance. You can bring them to our office.`;
      }
      else if (q.includes("flight") || q.includes("ticket")) {
        if (pipeline && pipeline.stage === "deployment") {
          responseText = `Hello ${candidate.firstName}, your flight ticket has been booked! We will send the PDF shortly.`;
        } else {
          responseText = `Hello ${candidate.firstName}, your flight hasn't been scheduled yet. You are currently in the ${pipeline ? pipeline.stage : 'initial'} stage.`;
        }
      }
      else {
        responseText = `Hello ${candidate.firstName}! I received your message. If you are asking about your status or documents, just text "status" or "documents". Otherwise, an agent will reply soon.`;
      }
    }

    // 4. Response Generation via WhatsApp Service
    await WhatsappService.sendTextMessage(tenantId, phone, responseText);
  }
}
