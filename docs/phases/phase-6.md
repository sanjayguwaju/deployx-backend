## PHASE 6 — Finance, Payroll, Compliance
**Maps to spec §17 (Finance), §18 (Payroll), §19 (Compliance)**

### 6.1 Objective
Make money and regulatory obligations trackable and auditable. Payroll is explicitly lower priority — defer it if timeline is tight, per the MVP note in the master plan.

### 6.2 In scope
- Revenue/expense tracking tied to demands and candidates
- Employer + candidate invoicing
- Commission tracking (feeds the Phase 4 Agent Portal, now with real data instead of a stub)
- Compliance: license tracking, embassy document tracking, expiry alerts
- (Lower priority) Internal payroll: attendance, leave, payslips

### 6.3 Out of scope
- Full accounting-grade double-entry ledger — this is operational finance tracking, not a GL system. If deep accounting is needed, integrate Xero/QuickBooks (§34) rather than building one.
- Payment gateway integration for the *SaaS billing* side — that's Phase 9 (tenant subscriptions), not this phase (this phase is the agency's own client-facing invoicing)

### 6.4 Finance entities
```
Invoice:
  invoice_number, tenant_id, billed_to_type: employer|candidate,
  billed_to_id, line_items[]: { description, amount, ref_type, ref_id },
  subtotal, tax, total, currency,
  status: draft | sent | paid | overdue | cancelled,
  due_date, paid_at, payment_method,
  created_at, updated_at

Expense:
  tenant_id, category, amount, currency, description,
  related_demand_id (nullable), related_candidate_id (nullable),
  incurred_at, recorded_by

Commission:
  agent_id, candidate_id, demand_id,
  amount, currency, status: pending|approved|paid,
  approved_by, paid_at
```

### 6.5 Compliance entities
```
License:
  tenant_id, license_type, license_number, issuing_authority,
  issued_date, expiry_date, document_url, status: active|expiring|expired

ComplianceCheck (per demand or per deployment — labour approval etc.):
  entity_type: demand|deployment, entity_id,
  check_type: labour_approval|embassy_clearance|other,
  status: pending|passed|failed, document_url, checked_at, checked_by
```
Expiry alert job: extend the Phase 3 §3.8 expiry-reminder job to also scan `License.expiry_date` — same job, wider scan scope, not a second scheduler.

### 6.6 Payroll (lower priority — build only if timeline allows)
```
Employee (internal staff, not candidates):
  user_id (ref), base_salary, join_date

Attendance:
  employee_id, date, status: present|absent|leave|holiday

LeaveRequest:
  employee_id, from_date, to_date, type, status: pending|approved|rejected

Payslip (generated monthly):
  employee_id, month, base_salary, bonus, deductions, net_pay, pdf_url
```

### 6.7 API surface
```
GET  /invoices                        (filterable: employer, candidate, status)
POST /invoices
PATCH /invoices/:id/mark-paid

GET  /expenses
POST /expenses

GET  /commissions?agent_id=
POST /commissions/:id/approve
POST /commissions/:id/mark-paid

GET  /compliance/licenses
POST /compliance/licenses
GET  /compliance/checks?entity_type=&entity_id=
POST /compliance/checks

# Payroll (if built this phase)
GET  /payroll/attendance
POST /payroll/leave-requests
GET  /payroll/payslips/:employeeId/:month
```

### 6.8 Acceptance criteria
- [ ] An invoice can be created against an employer or candidate, correctly totals line items with tax, and transitions through draft → sent → paid
- [ ] An expense can be logged and optionally linked to a demand or candidate for cost-per-deployment reporting later (Phase 7)
- [ ] Commission records are created (manually or automation-triggered on deployment completion) and become visible in the Agent Portal (Phase 4) with real data
- [ ] License records track expiry and appear in the expiry-alert scan alongside medical/visa expiries
- [ ] Compliance checks can be recorded per demand/deployment and block progression if `status = failed` (tie this back into the Phase 2 automation engine as a new gate condition)
- [ ] (If built) Attendance, leave, and payslip generation work end-to-end for at least one test employee

---

## Cross-Phase Notes

- **Phase 4 depends on Phase 1–3 data existing** — build and test with realistic seed data (a few candidates across multiple pipeline stages) before wiring up portal views, or the "read-mostly" scoping is untestable.
- **Phase 5's notification layer becomes the single dispatch point going forward** — retrofit Phase 2/3's automation triggers to use it rather than leaving two notification paths running in parallel.
- **Phase 6 commission data feeds back into Phase 4's Agent Portal** — sequence matters: don't polish the leaderboard UI until real commission data exists to display.
- **Compliance checks as an automation gate** is the one piece of Phase 6 that reaches back into the Phase 2 engine — flag this explicitly to Claude Code so it doesn't treat compliance as a purely standalone module.
