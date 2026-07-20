## PHASE 4 — Portals (Employer, Candidate, Agent)
**Maps to spec §12 (Employer Portal), §13 (Candidate Portal), §14 (Agent Portal)**

### 4.1 Objective
External-facing, read-mostly access for the three non-staff roles introduced in Phase 1's role matrix. No new domain data — this phase is entirely about exposing existing data (candidates, demands, pipelines, medical/visa/ticket/deployment, invoices) through scoped, read-mostly views.

### 4.2 In scope
- Employer portal: view own demands, candidates in their pipelines, documents, invoices
- Candidate portal: self-service tracking of own application + document download
- Agent portal: own candidates, commission, performance, leaderboard
- Portal auth (separate login flow from staff auth, same underlying user table)

### 4.3 Out of scope
- Contract e-signature (Phase 5 — portals can *view* contract status, not generate/sign)
- Any write access beyond narrow exceptions listed in §4.5–4.7
- Mobile app (Phase 10)

### 4.4 Architecture decision
Build portals as **route groups under the existing admin app with role-based middleware**, not separate applications. Reasons: shared auth, shared component library, one deployment pipeline. Only split into a separate app later if traffic/security isolation genuinely demands it (Enterprise white-label tier, Phase 9+).

```
/portal/employer/*   — middleware: role === 'employer', scoped to own employer_id
/portal/candidate/*  — middleware: role === 'candidate', scoped to own candidate_id
/portal/agent/*      — middleware: role === 'agent', scoped to own agent_id
```

### 4.5 Employer Portal — scope
```
View:
  - Own demands (list + detail, status, approval state)
  - Candidates in pipeline for own demands (limited fields — no passport number,
    no full document set; show status/stage only, not sensitive PII)
  - Documents shared with them (agreements, demand-related docs)
  - Invoices (read-only, Phase 6 dependency — stub with "coming soon" if Phase 6 not yet built)
  - Interview schedule for own demands
Write (limited):
  - Approve/reject a demand-related interview slot
  - Upload agreement counter-signature (file upload only, not full e-sign — that's Phase 5)
```

### 4.6 Candidate Portal — scope
```
View:
  - Own application status / pipeline stage (single most-relevant pipeline if in
    multiple, or a list if genuinely in more than one active pipeline)
  - Medical, visa, ticket, deployment status (read-only, plain-language labels —
    don't expose internal notes or other candidates' data)
  - Notifications feed
Write (limited):
  - Update own contact details (phone/whatsapp/email/address) — flagged for HR review, not auto-applied
  - Download own documents (passport copy, medical report, contract once available)
```
**Privacy note:** candidate portal must never expose employer-side notes, internal scoring, or other candidates' data. Field-level allowlist, not a blocklist — safer to explicitly list what's visible than to hide-by-exception.

### 4.7 Agent Portal — scope
```
View:
  - Own referred candidates + their current stage
  - Commission ledger (earned, pending, paid — Phase 6 dependency, stub if not ready)
  - Performance metrics (candidates deployed this month/quarter)
  - Leaderboard (opt-in per tenant — some agencies may not want agents seeing
    each other's numbers; make this a tenant-level setting)
Write:
  - Submit a new candidate referral (creates a candidate record in "registered"
    status, tagged with referring agent_id)
```

### 4.8 API surface
```
GET  /portal/employer/demands
GET  /portal/employer/demands/:id/pipeline     (scoped, limited fields)
GET  /portal/employer/invoices
POST /portal/employer/agreements/:id/counter-sign

GET  /portal/candidate/me
GET  /portal/candidate/me/status
PATCH /portal/candidate/me/contact               (flags for review, doesn't auto-apply)
GET  /portal/candidate/me/documents/:docId       (download)

GET  /portal/agent/candidates
GET  /portal/agent/commissions
GET  /portal/agent/leaderboard                   (respect tenant opt-in setting)
POST /portal/agent/referrals
```

### 4.9 Acceptance criteria
- [ ] An employer user can log in and see only demands/pipelines belonging to their own employer_id — verified with a negative test (cannot see another employer's data via ID guessing)
- [ ] A candidate can log in and see only their own status/documents — same negative-test requirement
- [ ] An agent can submit a referral that creates a properly tagged candidate record
- [ ] Field-level allowlists are enforced server-side for all three portals (not just hidden in UI)
- [ ] Leaderboard visibility respects the tenant-level opt-in setting
- [ ] Portal auth correctly separates from staff auth sessions (a staff user and portal user session shouldn't cross-contaminate)
