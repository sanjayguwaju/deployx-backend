import { Schema, model, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
  municipalityId?: Types.ObjectId;
  actorId?: Types.ObjectId;
  actorEmail?: string;
  module: string;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId;
  entityLabel?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality" },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorEmail: String,
    module: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: Schema.Types.ObjectId,
    entityLabel: String,
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    meta: Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true },
);

auditLogSchema.index({ municipalityId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
