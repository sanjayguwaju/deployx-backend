# PHASE 1 — Candidate & Employer CRM
**Maps to spec §2 (Candidate CRM), §3 (Employer CRM), §37 (Candidate Search), §38 (Security)**

### 1.1 Objective
Get to a CRUD-complete, role-gated CRM for candidates and employers — no pipeline, no workflow, no automation yet. This is pure data-modeling + access control.

### 1.2 In scope
- Candidate entity (rename/extend from Palika's "citizen" model)
- Employer entity (rename/extend from Palika's "department" or "service provider" model, whichever is closer)
- Document upload against both entities (R2)
- Search across candidates
- Role-based view restrictions
- Baseline security hardening

### 1.3 Out of scope (explicitly — don't let Claude Code wander into these)
- Pipeline/Kanban (Phase 2)
- Demand creation (Phase 2)
- Medical/Visa/Ticket/Deployment (Phase 3)
- Any workflow automation or status-change triggers
- Portals (employer/candidate self-service login — Phase 4)

### 1.4 Candidate entity — fields
```
Personal:
  full_name, photo_url, passport_number, citizenship,
  date_of_birth, gender, languages[], religion (optional),
  marital_status

Contact:
  phone, whatsapp, email, address {province, district, municipality, ward}

Skills:
  profession, experience_years, certifications[], education[]

Documents (each: file_url, uploaded_at, uploaded_by, verified boolean):
  passport, cv, certificates[], driving_license, medical_report, police_clearance

Status (enum, single source of truth — this becomes the pipeline stage in Phase 2):
  registered | interview_scheduled | selected | medical | visa_processing |
  ticket_booked | deployed | returned | rejected | blacklisted

Meta:
  tenant_id, office_id, created_by, created_at, updated_at
```

### 1.5 Employer entity — fields
```
Company profile:
  company_name, country, logo_url, industry

Contact persons[]:
  name, designation, phone, email

Agreements[]:
  document_url, signed_date, expiry_date, status

History:
  previous_demands[] (ref → Demand, populated in Phase 2 — leave as empty relation for now)
  payment_status
  notes[]

Meta:
  tenant_id, created_by, created_at, updated_at
```

### 1.6 API surface (adjust naming to match Palika's existing controller conventions)
```
Candidates:
  GET    /candidates                 (filterable: status, skill, office, search query)
  GET    /candidates/:id
  POST   /candidates
  PATCH  /candidates/:id
  DELETE /candidates/:id              (soft delete — never hard delete a candidate record)
  POST   /candidates/:id/documents    (upload)
  DELETE /candidates/:id/documents/:docId

Employers:
  GET    /employers
  GET    /employers/:id
  POST   /employers
  PATCH  /employers/:id
  DELETE /employers/:id               (soft delete)
  POST   /employers/:id/agreements
```

### 1.7 Search (§37)
- Fields: passport number, phone, skill/profession, status, language, experience range
- Implementation: extend whatever indexing Palika OS already uses (don't introduce Meilisearch/Elastic at this stage — that's a Phase 7+ decision if the generic search proves insufficient)
- Must respect tenant/office scoping — a search can never leak across tenants

### 1.8 Role-based access (§38) for this phase specifically
| Role | Candidate access | Employer access |
|---|---|---|
| Super Admin / Owner | Full | Full |
| HR / Recruiter | Full CRUD within their office | Read + agreement upload |
| Employer | None (portal comes in Phase 4) | N/A |
| Finance | Read-only | Read-only (payment_status visible) |
| Others | No access | No access |

Implement via whatever ability/permission pattern Palika OS already uses (CASL or equivalent) — extend the rule set, don't fork a second permission system.

### 1.9 Security baseline for this phase
- 2FA on login (if not already present in Palika's auth)
- Documents encrypted at rest (R2 bucket policy / server-side encryption)
- Field-level access: `passport_number` and documents should not be returned in list views, only detail views, to reduce accidental exposure in logs/screenshots
- Audit log entries on every create/update/delete of candidate and employer records

### 1.10 Acceptance criteria
- [ ] A Recruiter can create, edit, and soft-delete a candidate with full personal/contact/skills data
- [ ] Documents can be uploaded, viewed, and deleted against a candidate record, stored in R2
- [ ] An Employer record can be created with contact persons and at least one agreement document
- [ ] Search returns correct, tenant-scoped results across passport/phone/skill/status/language
- [ ] Role restrictions in §1.8 are enforced server-side (not just hidden in UI)
- [ ] Every mutation on candidate/employer records produces an audit log entry
- [ ] No pipeline, demand, or status-automation logic exists yet — status field is settable manually only

---
## Existing Context (Current Candidate Schema)
```typescript
import { Schema, model, Document, Types } from "mongoose";

export interface ICandidate extends Document {
  tenantId: Types.ObjectId;
  officeId: Types.ObjectId;
  householdId?: Types.ObjectId;
  firstName: string;
  middleName?: string;
  lastName: string;
  firstNameNp?: string;
  lastNameNp?: string;
  gender?: "male" | "female" | "other";
  dateOfBirthAd?: Date;
  dateOfBirthBs?: string;
  passportNumber?: string;
  citizenshipIssuedDistrict?: string;
  nationalIdNumber?: string;
  phone?: string;
  email?: string;
  permanentAddress?: string;
  occupation?: string;
  photoUrl?: string;
  isVerified: boolean;
  status: "pending" | "approved" | "rejected";
  isDeleted: boolean;
}

const candidateSchema = new Schema<ICandidate>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    officeId: { type: Schema.Types.ObjectId, ref: "Office", required: true },
    householdId: { type: Schema.Types.ObjectId },
    firstName: { type: String, required: true },
    middleName: String,
    lastName: { type: String, required: true },
    firstNameNp: String,
    lastNameNp: String,
    gender: { type: String, enum: ["male", "female", "other"] },
    dateOfBirthAd: Date,
    dateOfBirthBs: String,
    passportNumber: { type: String, sparse: true },
    citizenshipIssuedDistrict: String,
    nationalIdNumber: String,
    phone: String,
    email: String,
    permanentAddress: String,
    occupation: String,
    photoUrl: String,
    isVerified: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

candidateSchema.index({ tenantId: 1, isDeleted: 1 });
candidateSchema.index({ passportNumber: 1 }, { sparse: true });
candidateSchema.index({ firstName: "text", lastName: "text" });

export const Candidate = model<ICandidate>("Candidate", candidateSchema);
```
