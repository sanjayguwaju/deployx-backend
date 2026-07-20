## PHASE 7 — Analytics & Reporting
**Maps to spec §1 (Dashboard KPIs), §23 (Analytics), §28 (Reports)**

### 7.1 Objective
Turn the operational data accumulated in Phases 1–6 into decision-support: a dashboard, trend analytics, and a report system that scales to "100+ reports" without hand-coding each one.

### 7.2 In scope
- Dashboard KPI widgets (§1)
- Analytics views: trends, forecasts (statistical, not AI — AI forecasting is Phase 8), success rates
- A generic report/query builder engine, seeded with the top 10–15 highest-value reports
- Export (Excel/PDF/CSV)

### 7.3 Out of scope
- AI-driven forecasting/insights (Phase 8)
- Every single one of the "100+ reports" hand-built individually — see §7.6

### 7.4 Dashboard KPIs (§1)
```
Widgets (each backed by a simple aggregation query, cached with short TTL):
  - candidates_in_pipeline (count by stage)
  - active_demands (count by status)
  - visa_processing (count)
  - medical_pending (count)
  - interviews_today (list)
  - deployment_calendar (upcoming N days)
  - revenue (this month vs last month)
  - commission (pending vs paid)
  - employer_performance (top N by demand volume/fill rate)
  - upcoming_expiries (medical/visa/license within reminder window — reuse Phase 3/6 job)
```
Cache aggressively (dashboard queries run on every page load) — Redis cache with a 1–5 minute TTL is enough; don't recompute on every request.

### 7.5 Analytics (§23)
```
Trend views (time-series, filterable by office/country/date range):
  - Deployments over time
  - Revenue over time
  - Top countries by deployment volume
  - Best-performing employers (fill rate, repeat demand rate)
  - Best-performing agents (deployment count, commission earned)
  - Medical pass rate (%)
  - Visa success rate (%)
  - Interview-to-selection conversion rate
  - Monthly trend deltas + simple linear forecast (basic regression, not ML —
    flag full predictive forecasting as a Phase 8 AI feature)
```

### 7.6 Report Engine (§28) — the key architectural decision
**Do not hand-build 100+ report endpoints.** Build one generic engine instead:
```
ReportDefinition:
  name, description, category,
  base_entity: candidate|demand|pipeline|invoice|commission|deployment|etc,
  filters_schema[]: { field, type, operator_options },
  columns[]: { field, label, format },
  default_sort, default_group_by

GET /reports                          (list available report definitions)
POST /reports/:id/run                 (filters as body, returns rows)
POST /reports/:id/export?format=xlsx|pdf|csv
```
Seed this with the ~10–15 reports the spec explicitly names (deployment, country, employer, visa, medical, revenue, commission, expenses) as `ReportDefinition` rows, not hardcoded controllers. New reports become data entries, not new code, once the engine exists — this is the single highest-leverage build decision in this phase.

### 7.7 Export
- Reuse existing PDF/Excel generation patterns from Phase 5 (contracts) and Phase 6 (invoices) rather than introducing a new export library
- CSV export is close to free once tabular data + column definitions exist from §7.6

### 7.8 API surface
```
GET /dashboard/kpis
GET /analytics/trends?metric=&range=&groupBy=
GET /reports
POST /reports/:id/run
POST /reports/:id/export
```

### 7.9 Acceptance criteria
- [ ] All ten dashboard widgets in §7.4 render correct, tenant-scoped data with sub-second load (via caching)
- [ ] At least 5 trend analytics views from §7.5 are functional with date-range filtering
- [ ] The generic report engine can run at least 10 seeded report definitions without entity-specific controller code
- [ ] A new report can be added by inserting a `ReportDefinition` row alone (no code deploy) — verify this explicitly, it's the point of the phase
- [ ] Export works in all three formats (Excel/PDF/CSV) for at least 3 different report types
