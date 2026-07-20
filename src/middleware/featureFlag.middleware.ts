import { NextFunction, Response } from "express";
import { AuthRequest } from "../types";
import { FeatureFlag } from "../models/FeatureFlag";
import { sendError } from "../utils/response";

export const requireFeature = (featureKey: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user?.tenantId;
      const query: any = { key: featureKey };
      if (tenantId) query.tenantId = tenantId;

      const flag = await FeatureFlag.findOne(query);
      
      // If the flag doesn't exist, we assume it's disabled or not ready
      if (!flag) {
        return sendError(res, 403, `Feature '${featureKey}' is not available.`);
      }

      // If it's globally disabled, block
      if (!flag.isActive) {
        return sendError(res, 403, `Feature '${featureKey}' is currently disabled.`);
      }

      // If it has specific offices enabled, and the user's office is not in the list, block
      // Admin users might not have a officeId, so we let them bypass office checks if needed, 
      // or we can strictly enforce it. Let's strictly enforce if enabledOffices has entries and user is in a office.
      if (flag.enabledOffices.length > 0) {
        const userOfficeId = req.user?.officeId;
        if (userOfficeId) {
          const isEnabledForUserOffice = flag.enabledOffices.some((officeId) => officeId.toString() === userOfficeId.toString());
          if (!isEnabledForUserOffice) {
            return sendError(res, 403, `Feature '${featureKey}' is not enabled for your office.`);
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
