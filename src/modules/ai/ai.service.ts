// Mock implementation of Claude API integrations for MVP

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
}
