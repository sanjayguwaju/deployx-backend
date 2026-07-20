## PHASE 5 — Documents, Contracts, Communications
**Maps to spec §15 (Document Management), §16 (Digital Contracts), §20 (Notifications), §26 (Communication Center)**

### 5.1 Objective
Digitize paperwork end-to-end: searchable document storage, generated contracts with e-signature, and a unified communication layer across email/SMS/WhatsApp.

### 5.2 In scope
- Document management (tagging, search, already-uploaded docs from Phases 1–3 get surfaced here as a unified view)
- Contract/letter generation from templates (PDF)
- E-signature capture and status tracking
- Notification center (multi-channel dispatch)
- Communication center (templates, bulk send, logs)

### 5.3 Out of scope
- Finance/invoicing (Phase 6 — contract *generation* is here, invoice generation is not)
- AI-assisted drafting (Phase 8)

### 5.4 Document Management (§15)
This phase is mostly a **unification layer**, not new storage — Phases 1–3 already upload to R2 against candidates/employers/pipeline entities.
```
DocumentIndex (materialized view or dedicated collection for fast search):
  document_id, owner_type: candidate|employer|demand|contract,
  owner_id, document_type: passport|cv|certificate|driving_license|medical_report|
    police_clearance|agreement|contract|offer_letter|invoice|photo,
  file_url, tags[], uploaded_by, uploaded_at, verified boolean

GET /documents?type=&owner_type=&tag=&search=
```
Everything searchable — this is the "one place to find any document across the system" requirement from the spec.

### 5.5 Digital Contracts (§16)
Templates needed:
```
- Employment Contract
- Offer Letter
- Demand Letter
- MOU
```
```
ContractTemplate:
  name, template_body (with merge fields e.g. {{candidate.full_name}}, {{demand.salary}}),
  applicable_to: employment_contract|offer_letter|demand_letter|mou

Contract (generated instance):
  template_id, candidate_id (nullable), employer_id (nullable), demand_id (nullable),
  pdf_url (rendered snapshot),
  signature_status: draft | sent | signed_candidate | signed_employer | fully_signed,
  signatures[]: { signer_type, signer_id, signature_url, signed_at, ip_address },
  created_at, updated_at
```
E-signature: a simple signature-pad capture (reuse the pattern from Phase 3's deployment digital signature) is sufficient for MVP — don't integrate a third-party e-sign provider (DocuSign etc.) unless a customer specifically requires legal-grade e-signature; note this as a flagged upgrade path for Enterprise tier.

### 5.6 Notifications (§20)
```
NotificationDispatch:
  recipient_type: candidate|employer|agent|staff,
  recipient_id, channel: sms|whatsapp|email|push|in_app,
  template_id (nullable — some are ad hoc), payload, status: queued|sent|failed,
  sent_at, error_message (if failed)
```
- Route through the existing queue (BullMQ-equivalent already in Palika OS) — this phase adds channel adapters (WhatsApp Business API, SMS provider, email provider), not a new queue.
- Every automation trigger from Phase 2/3 should now dispatch through this unified layer instead of ad hoc calls.

### 5.7 Communication Center (§26)
```
- Message templates (reusable, per channel, with merge fields)
- Bulk messaging (select a filtered candidate/employer list → send templated message)
- Call logs (manual entry — no telephony integration in this phase)
- Unified inbox view per candidate/employer (all past dispatches, one timeline)
```

### 5.8 API surface
```
GET  /documents
GET  /contracts/templates
POST /contracts                      (generate from template + entity refs)
POST /contracts/:id/send
POST /contracts/:id/sign             (signature capture)
GET  /contracts/:id/status

POST /notifications/dispatch         (internal — used by automation engine)
GET  /notifications?recipient_id=

GET  /comms/templates
POST /comms/bulk-send
GET  /comms/:entityType/:entityId/timeline
```

### 5.9 Acceptance criteria
- [ ] All documents from Phases 1–3 are visible and searchable through one unified document view
- [ ] A contract can be generated from a template with correct merge-field substitution and produces a valid PDF
- [ ] Signature capture works for both candidate and employer signers, and `signature_status` transitions correctly through to `fully_signed`
- [ ] Automation triggers from Phase 2/3 dispatch notifications through the new unified channel layer (verify WhatsApp/SMS/email all fire correctly for at least one real trigger)
- [ ] Bulk send correctly targets a filtered candidate list and logs each dispatch
- [ ] A per-candidate/employer communication timeline shows all past dispatches in order

---

## Existing Context

**Document.ts (Current Base Model)**
```typescript
import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface IDocument extends MongooseDocument {
  documentType: string;
  templateName: string;
  data: Record<string, any>;
  issuedBy: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  verificationHash: string;
  issueDate: Date;
  status: "valid" | "revoked";
  qrCodeUrl?: string;
}

const DocumentSchema = new Schema<IDocument>(
  {
    documentType: { type: String, required: true },
    templateName: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    verificationHash: { type: String, required: true, unique: true },
    issueDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["valid", "revoked"], default: "valid" },
    qrCodeUrl: { type: String },
  },
  { timestamps: true }
);

export const AppDocument = mongoose.model<IDocument>("Document", DocumentSchema);
```

**Notification.ts (Current Base Model)**
```typescript
import { Schema, model, Document, Types } from "mongoose";

export interface INotification extends Document {
  tenantId: Types.ObjectId;
  recipientId?: Types.ObjectId;
  recipientPhone?: string;
  recipientEmail?: string;
  channel: "email" | "sms" | "push" | "in-app";
  subject?: string;
  body: string;
  status: "pending" | "sent" | "failed" | "delivered";
  sentAt?: Date;
  failReason?: string;
  readAt?: Date;
  entityType?: string;
  entityId?: Types.ObjectId;
}

const notificationSchema = new Schema<INotification>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User" },
    recipientPhone: String,
    recipientEmail: String,
    channel: { type: String, enum: ["email","sms","push","in-app"], required: true },
    subject: String,
    body: { type: String, required: true },
    status: { type: String, enum: ["pending","sent","failed","delivered"], default: "pending" },
    sentAt: Date,
    failReason: String,
    readAt: Date,
    entityType: String,
    entityId: Schema.Types.ObjectId,
  },
  { timestamps: true },
);

notificationSchema.index({ recipientId: 1, readAt: 1 });
notificationSchema.index({ status: 1, createdAt: 1 });

export const Notification = model<INotification>("Notification", notificationSchema);
```
