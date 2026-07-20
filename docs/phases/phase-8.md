## PHASE 8 — AI Layer
**Maps to spec §6 (AI Matching), §22 (AI Assistant), §27 (File Verification), §36 (AI OCR), and select "Future AI Features"**

### 8.1 Objective
This is the differentiator layer — and the most expensive to rebuild if the underlying schema shifts under it. Sequence this only after Phases 1–7 have real usage data; don't build AI matching against a schema that's still churning.

### 8.2 In scope
- AI Candidate Matching (CV → demand suggestions with match %)
- AI OCR (passport/visa/certificate/ID extraction on upload)
- AI Assistant ("ask your data" natural-language queries)
- File verification (duplicate detection, document quality/completeness)

### 8.3 Explicitly deferred to v2.0 backlog (per spec's own "Future AI Features" list)
- AI interview scheduling
- AI salary benchmarking
- AI document fraud detection (beyond basic duplicate/quality checks in §8.6)
- AI demand forecasting
- AI multilingual translation
- AI email/WhatsApp drafting

Don't let a Claude Code session pull these in "while it's at it" — each is its own scoped phase later.

### 8.4 AI Candidate Matching (§6)
```
Flow: candidate CV uploaded/updated →
  1. Extract structured skills/experience (reuse OCR/parsing from §8.5 if CV is scanned;
     if already structured from Phase 1 form data, skip extraction)
  2. Generate embedding from candidate profile (skills + experience + education)
  3. Generate embedding from each open demand's requirements
  4. Cosine similarity → match % per open demand
  5. Return top N matches + flag missing skills (diff between demand requirements
     and candidate skills) + suggest alternative jobs (other demands above a
     lower threshold) + suggested salary (based on similar-profile historical placements)

API:
  GET /candidates/:id/matches          (top N demand matches with %, missing skills)
  GET /demands/:id/matches             (top N candidate matches for this demand)
```
Use the Claude API for embedding generation and for the missing-skills/alternative-job reasoning — don't hand-roll a custom ML matching model for v1.

### 8.5 AI OCR (§36)
```
Flow: document uploaded (any of the existing document types from Phase 1/3) →
  1. Send to Claude API (vision) with a type-specific extraction prompt
     (passport → name/number/DOB/nationality/expiry;
      visa → visa number/sponsor/expiry;
      certificate → institution/qualification/date;
      license → license number/class/expiry)
  2. Return structured JSON
  3. Present to user as a pre-filled form for confirmation — never auto-save
     extracted data without human confirmation, OCR errors on passport numbers
     are exactly the kind of mistake that causes real-world visa problems

API:
  POST /documents/:id/extract          (returns structured extraction, does not save)
  POST /documents/:id/confirm-extraction  (user-confirmed data gets saved to the entity)
```

### 8.6 File Verification (§27)
```
Checks run on upload (async job, not blocking the upload itself):
  - Passport validity: expiry date in the future, format sanity-check
  - Duplicate candidate: fuzzy match on passport_number + name + DOB against
    existing candidates in the tenant (flag for human review, never auto-merge/reject)
  - Document quality: resolution/blur check (simple image-quality heuristic,
    not a deep model) — flag "please re-upload, image unclear"
  - Missing documents: cross-check candidate's document set against what's
    required for their current pipeline stage, surface as a checklist gap

API:
  GET /candidates/:id/verification-status
```

### 8.7 AI Assistant — "Ask Your Data" (§22)
```
Flow: user types a natural-language question →
  1. Constrain to a fixed set of allowed query intents (candidate lookup,
     demand lookup, aggregate counts, revenue summary, expiry lookup) —
     do NOT expose a free-form text-to-SQL layer with direct DB execution,
     that's a serious security/data-leak risk in a multi-tenant system
  2. Claude API maps the question to one of the allowed intents + parameters
  3. Execute via the existing, already-permission-checked API endpoints
     (reuse Phase 1–7 endpoints, don't bypass them with direct queries)
  4. Return a natural-language summary of the result

Examples from spec, mapped to intents:
  "Show candidates ready for deployment" → candidate lookup, stage=deployment-ready
  "Who has expired passports?" → expiry lookup, doc_type=passport
  "Generate employer invoice" → action intent → calls Phase 6 invoice creation
    (should require explicit confirmation before executing a write action)
  "How many deployed this month?" → aggregate count, stage=deployed, range=this_month
  "Summarize revenue" → revenue summary (Phase 7 analytics)

API:
  POST /ai-assistant/query             (returns natural-language answer + underlying data)
```
**Critical constraint:** every "intent" the assistant can trigger must route through the same tenant-scoped, role-checked API endpoints as the rest of the app. The AI layer must never get a direct database connection — that's how a well-meaning natural-language feature becomes a cross-tenant data leak.

### 8.8 Acceptance criteria
- [ ] Candidate matching returns sensible match percentages and missing-skills diffs for at least 10 test candidates against 5 test demands
- [ ] OCR extraction correctly pre-fills a form for at least passport and visa document types, and nothing saves without explicit user confirmation
- [ ] Duplicate candidate detection flags at least one deliberately-seeded duplicate for human review (not auto-action)
- [ ] The AI Assistant correctly answers all 5 example questions from the spec, routed through existing scoped endpoints
- [ ] The AI Assistant cannot execute a write action (like generating an invoice) without an explicit confirmation step
- [ ] No component of this phase has a direct database connection independent of the existing permission-checked API layer
