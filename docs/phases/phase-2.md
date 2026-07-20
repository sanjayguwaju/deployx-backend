## PHASE 2 — Demand & Pipeline Engine
**Maps to spec §4 (Demand Management), §5 (Recruitment Pipeline), §24 (Workflow Automation), §25 (Task Management)**

### 2.1 Objective
This is the core of DeployX. Employers' manpower requests become trackable "demands," and candidates move through a visual pipeline against those demands — manually first, with automation layered in.

### 2.2 In scope
- Demand entity + approval workflow
- Candidate–Demand pipeline join (Kanban board, drag/drop)
- Task assignment tied to pipeline stages
- First layer of workflow automation (status-change triggers)

### 2.3 Out of scope
- Medical/Visa/Ticket/Deployment detail records (Phase 3 — Phase 2 only tracks pipeline *stage*, not the domain data behind each stage)
- Portals (Phase 4)
- Contracts/e-signature (Phase 5)
- Finance/invoicing tied to demands (Phase 6)

### 2.4 Demand entity — fields
```
country, employer_id (ref), profession, quantity_required,
salary {amount, currency}, accommodation (bool/details), food (bool/details),
contract {duration, terms_url},
interview_date, documents_required[],
status: draft | pending_approval | approved | rejected | closed,
approved_by, approved_at,
tenant_id, office_id, created_by, created_at, updated_at
```

### 2.5 Candidate Pipeline join entity
This is the critical modeling decision: **a candidate can be in multiple pipelines simultaneously** (applied to more than one demand), so this must be a join table, not a status field on the candidate.

```
CandidateDemandPipeline:
  candidate_id (ref), demand_id (ref),
  stage: applied | shortlisted | interview | selected | medical |
         visa | ticket | deployment | completed | rejected,
  stage_history[]: { stage, entered_at, entered_by },
  score (nullable, populated later by AI matching in Phase 8),
  assigned_to (user_id — for task assignment §25),
  notes[],
  created_at, updated_at
```

Note: this **replaces** the single `status` field approach from Phase 1's candidate entity as the operative pipeline state. Keep the Phase 1 `status` field for backward-compat/reporting summary only, and treat `CandidateDemandPipeline.stage` as source of truth going forward. Migration note: this needs a data-backfill plan if Phase 1 already has candidates with statuses set.

### 2.6 API surface
```
Demands:
  GET    /demands                    (filterable: employer, country, status)
  POST   /demands
  PATCH  /demands/:id
  POST   /demands/:id/approve
  POST   /demands/:id/reject

Pipeline:
  GET    /demands/:id/pipeline        (Kanban board data — grouped by stage)
  POST   /demands/:id/pipeline        (add candidate to this demand's pipeline)
  PATCH  /pipeline/:id/stage          (move stage — drag/drop endpoint)
  PATCH  /pipeline/:id/assign         (task assignment)
  GET    /pipeline/:id/history
```

### 2.7 Kanban / Drag & Drop
- Use whatever realtime layer Palika OS already has (Socket.IO per the earlier plan) to broadcast stage changes so multiple recruiters see the board update live
- Stage change = optimistic UI update + server confirm + broadcast to other connected clients on the same demand
- Stage order is fixed per the 9-stage list in §2.5 — don't make stages configurable yet (that's an Enterprise/v2 nice-to-have, not MVP)

### 2.8 Workflow automation (§24) — first layer only
Implement exactly one automation chain in this phase, as a template for the rest:
```
Trigger: pipeline stage → "medical" AND medical_result = "passed"
  (medical_result is a placeholder boolean/enum for now — full Medical module is Phase 3)
Action:
  1. Auto-move pipeline stage → "visa"
  2. Notify employer (via existing notification channel)
  3. Generate a checklist record (visa document checklist, static template for now)
  4. Assign to Visa Officer role (auto-assign task)
```
Build this as a generic **trigger → action job** pattern (queue-based) rather than hardcoding this one chain — Phase 3 and Phase 6 will add more triggers to the same engine.

### 2.9 Task Management (§25) for this phase
- Tasks are lightweight: `{ title, pipeline_id, assigned_to, due_date, status: pending|done, category: passport_verification|medical|embassy|accounts|hr|operations }`
- Auto-created by the automation engine (§2.8) and manually creatable by HR/Ops

### 2.10 Acceptance criteria
- [ ] A demand can be created, submitted for approval, and approved/rejected with the approver recorded
- [ ] A candidate can be added to a demand's pipeline and appears on the Kanban board at "applied"
- [ ] Dragging a candidate card to a new stage persists the change and broadcasts it live to other connected users viewing the same board
- [ ] Full stage history is retained per candidate-demand pair
- [ ] The one automation chain in §2.8 fires correctly and is visibly logged (so it's debuggable)
- [ ] Tasks can be assigned, and appear in an assignee's task list, filtered by category
- [ ] A candidate can simultaneously be in pipelines for two different demands without state conflict

---
## Existing Context (Current Demand Schema)
```typescript
import { Schema, model, Document, Types } from "mongoose";

export interface IDemand extends Document {
  tenantId: Types.ObjectId;
  officeId?: Types.ObjectId;
  trackingNumber: string;
  serviceType: string;
  candidateId?: Types.ObjectId;
  employerName: string;
  applicantPhone?: string;
  applicantEmail?: string;
  formData?: Record<string, unknown>;
  status: "submitted" | "under_review" | "pending_documents" | "approved" | "rejected" | "completed";
  priority: "low" | "normal" | "high" | "urgent";
  assignedTo?: Types.ObjectId;
  dueAt?: Date;
  completedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  outputDocumentUrl?: string;
  isDeleted: boolean;
}

const demandSchema = new Schema<IDemand>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    officeId: { type: Schema.Types.ObjectId, ref: "Office" },
    trackingNumber: { type: String, required: true, unique: true },
    serviceType: { type: String, required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "Candidate" },
    employerName: { type: String, required: true },
    applicantPhone: String,
    applicantEmail: String,
    formData: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ["submitted","under_review","pending_documents","approved","rejected","completed"],
      default: "submitted",
    },
    priority: { type: String, enum: ["low","normal","high","urgent"], default: "normal" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    dueAt: Date,
    completedAt: Date,
    rejectionReason: String,
    notes: String,
    outputDocumentUrl: String,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

demandSchema.index({ tenantId: 1, status: 1 });
demandSchema.index({ trackingNumber: 1 });

export const Demand = model<IDemand>("Demand", demandSchema);
```
