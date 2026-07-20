import { Request, Response } from "express";
import { AuthRequest } from "../../types";
import { sendSuccess, sendError } from "../../utils/response";
import { TaxRule } from "../../models/TaxRule";

export async function getTaxRules(req: AuthRequest, res: Response) {
  try {
    const rules = await TaxRule.find().sort({ createdAt: -1 });
    return sendSuccess(res, rules);
  } catch (error) {
    return sendError(res, 500, "Error fetching tax rules");
  }
}

export async function createTaxRule(req: AuthRequest, res: Response) {
  try {
    const rule = await TaxRule.create({
      tenantId: req.user!.tenantId,
      ...req.body,
    });
    return sendSuccess(res, rule, "Tax rule created successfully", 201);
  } catch (error) {
    return sendError(res, 500, "Error creating tax rule");
  }
}

// Very basic json rules evaluator
export async function evaluateTax(req: AuthRequest, res: Response) {
  try {
    const { taxType, inputs } = req.body; // e.g. taxType: "property", inputs: { zone: "A", sqft: 1500 }
    
    // Find active rule matching taxType and conditions
    // For simplicity, we just find the first rule that matches taxType and where inputs match conditions
    // A robust engine would use jsonLogic or similar
    
    const rules = await TaxRule.find({ taxType, isActive: true });
    
    let matchedRule = null;
    for (const rule of rules) {
      let isMatch = true;
      if (rule.conditions) {
        for (const [key, val] of Object.entries(rule.conditions)) {
          if (inputs[key] !== val) {
            isMatch = false;
            break;
          }
        }
      }
      if (isMatch) {
        matchedRule = rule;
        break;
      }
    }

    if (!matchedRule) {
      return sendError(res, 404, "No applicable tax rule found for these inputs");
    }

    // Calculate tax
    let calculatedTax = matchedRule.baseRate * matchedRule.multiplier;
    
    // If input has sqft, multiply it
    if (inputs.sqft) {
      calculatedTax *= inputs.sqft;
    }

    return sendSuccess(res, {
      ruleApplied: matchedRule.name,
      baseRate: matchedRule.baseRate,
      calculatedTax,
      currency: "NPR"
    });

  } catch (error) {
    return sendError(res, 500, "Error evaluating tax");
  }
}
