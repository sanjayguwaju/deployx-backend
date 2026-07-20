import { Schema, Types } from "mongoose";
import { tenantContext } from "../utils/tenantContext";

export function tenantPlugin(schema: Schema) {
  // Only apply to schemas that have a tenantId
  const hasTenantId = schema.path("tenantId");
  if (!hasTenantId) return;

  const methods = [
    "find",
    "findOne",
    "findOneAndDelete",
    "findOneAndReplace",
    "findOneAndUpdate",
    "countDocuments",
    "updateMany",
    "updateOne",
  ];

  methods.forEach((method) => {
    schema.pre(method as any, function (this: any, next) {
      const store = tenantContext.getStore();
      
      if (store && store.tenantId && !store.bypassTenant) {
        // Inject tenantId filter
        this.where({ tenantId: store.tenantId });
      }
      
      next();
    });
  });

  // Handle aggregates
  schema.pre("aggregate", function (this: any, next) {
    const store = tenantContext.getStore();
    
    if (store && store.tenantId && !store.bypassTenant) {
      // Unshift a $match stage to filter by tenantId
      this.pipeline().unshift({
        $match: { tenantId: new Types.ObjectId(store.tenantId) },
      });
    }
    
    next();
  });
}
