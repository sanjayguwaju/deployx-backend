## PHASE 3 — Domain Modules: Medical, Visa, Ticket, Deployment
**Maps to spec §8 (Medical), §9 (Visa Processing), §10 (Ticket Management), §11 (Deployment), §21 (Calendar)**

### 3.1 Objective
Give real substance to the pipeline stages introduced conceptually in Phase 2. Each of these is a genuinely new domain — Palika OS has no equivalent, so expect more net-new code here than in Phases 1–2.

### 3.2 In scope
- Medical record tracking
- Visa processing record
- Ticket/flight record
- Deployment confirmation + digital signature
- Unified calendar aggregating all date-driven events across these four modules

### 3.3 Out of scope
- Contract generation / PDF templating (Phase 5 — deployment digital signature here is a simple signature capture, not a full contract e-signature flow)
- Finance/invoicing tied to medical or ticket costs (Phase 6)
- Any AI-driven document extraction (Phase 8 — data entry is manual in this phase)

### 3.4 Medical record — fields
```
candidate_id (ref), pipeline_id (ref),
booked_date, hospital_name,
result: pending | passed | failed,
report_url (document upload),
expiry_date,
created_at, updated_at
```
Trigger point: `result = "passed"` fires the Phase 2 §2.8 automation chain (now backed by real data instead of a placeholder).
Trigger point: `result = "failed"` should move pipeline stage → `rejected` and notify HR (new automation chain, same engine).

### 3.5 Visa record — fields
```
candidate_id (ref), pipeline_id (ref),
visa_number, sponsor_name, embassy,
status: applied | in_review | approved | rejected,
expiry_date,
documents[] (upload),
timeline_events[]: { event, date, note }  — free-form log since embassy processes vary widely
created_at, updated_at
```

### 3.6 Ticket record — fields
```
candidate_id (ref), pipeline_id (ref),
airline, flight_number, pnr,
departure_datetime, arrival_datetime,
departure_airport, arrival_airport,
airport_pickup: { arranged bool, contact_name, contact_phone },
ticket_pdf_url,
created_at, updated_at
```

### 3.7 Deployment record — fields
```
candidate_id (ref), pipeline_id (ref),
actual_deployment_date, departure_airport,
receiving_company, receiving_contact,
arrival_confirmation: { confirmed bool, confirmed_at, confirmed_by },
digital_signature_url (simple signature-pad capture, stored as image),
created_at, updated_at
```
On save with `arrival_confirmation.confirmed = true`, auto-move pipeline stage → `completed`.

### 3.8 Calendar (§21)
- Read-only aggregation view, not a new source of truth
- Pulls: interview_date (demand), medical.booked_date, medical.expiry_date, visa.expiry_date, ticket.departure_datetime, deployment.actual_deployment_date
- Expiry reminders: a scheduled job (daily) scans for records with expiry_date within N days (configurable, default 30) and pushes a notification via the existing notification channel
- No new UI framework needed — a filterable list view keyed by date is sufficient for MVP; a full calendar-grid UI is a nice-to-have, not required for acceptance

### 3.9 API surface
```
/pipeline/:id/medical      GET, POST, PATCH
/pipeline/:id/visa         GET, POST, PATCH
/pipeline/:id/ticket       GET, POST, PATCH
/pipeline/:id/deployment   GET, POST, PATCH
/calendar                  GET (filterable: date range, event type, office)
```

### 3.10 Acceptance criteria
- [ ] Medical, Visa, Ticket, and Deployment records can each be created and updated against a candidate's active pipeline entry
- [ ] Medical result "passed" correctly triggers the automated move to Visa stage + employer notification + checklist + task assignment
- [ ] Medical result "failed" correctly triggers move to rejected + HR notification
- [ ] Deployment confirmation correctly triggers move to completed
- [ ] The calendar view surfaces all date-driven events across these four modules in one filterable list
- [ ] Expiry reminder job runs daily and correctly identifies records within the reminder window
- [ ] Digital signature capture on deployment stores and retrieves an image correctly

---
## Existing Context
*Note: This phase introduces entirely new domains. It will reference the `Candidate` and `Demand` entities created and updated in Phases 1 and 2, but requires scaffolding completely new schemas for Medical, Visa, Ticket, and Deployment tracking using standard Palika OS structural conventions.*
