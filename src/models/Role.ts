import { Schema, model, Document, Types } from "mongoose";
import { SystemRole, PermissionAction, ModuleSlug } from "../types";

export interface IPermission {
  module: ModuleSlug | string;
  action: PermissionAction;
}

export interface IRole extends Document {
  tenantId?: Types.ObjectId;
  name: string;
  nameNp?: string;
  slug: SystemRole | string;
  description?: string;
  isSystem: boolean;
  level: number; // 0=platform, 1=municipality, 2=section, 3=ward, 4=staff, 5=citizen
  sectionSlug?: string; // Phase 2: department slug for section_head scoping (e.g. "health", "education")
  permissions: IPermission[];
}

const roleSchema = new Schema<IRole>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" },
    name: { type: String, required: true },
    nameNp: String,
    slug: { type: String, required: true },
    description: String,
    isSystem: { type: Boolean, default: false },
    level: { type: Number, default: 4 },
    sectionSlug: { type: String }, // Phase 2: ties section_head to a specific department
    permissions: [
      {
        module: { type: String, required: true },
        action: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

roleSchema.index({ tenantId: 1, slug: 1 }, { unique: true, sparse: true });

export const Role = model<IRole>("Role", roleSchema);
