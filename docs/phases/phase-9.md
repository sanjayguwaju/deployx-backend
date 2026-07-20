## PHASE 9 — SaaS Admin Panel
**Maps to spec §40 (SaaS Admin Panel — your business, not the agency's)**

### 9.1 Objective
The layer that turns DeployX from "a system one agency uses" into "a product multiple agencies pay for." This is where you, as the DeployX owner, manage tenants.

### 9.2 In scope
- Tenant (agency) management
- Subscription plans + billing
- Trial periods
- Feature flags
- Usage analytics (across tenants, for you — not per-tenant analytics, that's Phase 7)
- Support ticket management
- System health monitoring
- Impersonate tenant (with mandatory audit logging)
- API key management (for §33/§34 integrations)

### 9.3 Out of scope
- Marketplace for add-ons (genuinely v2 — needs a stable plugin/extension architecture that doesn't exist yet)
- Multi-region infra / white-label domain automation (Phase 10)

### 9.4 Tenant entity (extends the tenant model already in place since Phase 0)
```
Tenant:
  name, subdomain, custom_domain (nullable, Enterprise only),
  plan: starter | professional | enterprise,
  status: trial | active | suspended | cancelled,
  trial_ends_at,
  billing: { stripe_customer_id, current_period_end },
  feature_flags: { ai_layer: bool, white_label: bool, api_access: bool, ... },
  created_at
```

### 9.5 Subscription & Billing
```
Plan:
  name, price, billing_interval: monthly|yearly,
  included_features[], user_limit, office_limit

Subscription:
  tenant_id, plan_id, status: trialing|active|past_due|cancelled,
  stripe_subscription_id, current_period_start, current_period_end

Webhook handling: Stripe (or local gateway) webhooks update Subscription.status —
this is the single source of truth for whether a tenant retains access.
```
For Nepal-based agencies, evaluate local payment gateway (eSewa/Khalti) alongside Stripe if targeting the domestic market seriously — flag as a decision point, don't assume Stripe-only.

### 9.6 Feature Flags
- Per-tenant flags gate access to Phase 8's AI layer, Phase 10's white-label, API access — tie plan tier to default flag values, but allow manual override per tenant (sales negotiated a custom deal, a trial extension, etc.)

### 9.7 Impersonate Tenant
```
POST /admin/tenants/:id/impersonate
  → issues a scoped session token as if logged in as that tenant's admin user
  → MANDATORY: writes an audit log entry with your admin user_id, target tenant_id,
    timestamp, and reason (require a reason field on this specific action — it's
    the one place in the system where a support action touches a customer's live
    data directly)
```

### 9.8 Usage Analytics (cross-tenant, for you)
```
- Active tenants over time
- MRR / churn
- Feature adoption (% of tenants using AI layer, portals, etc.)
- Storage/API usage per tenant (for usage-based billing tiers if introduced later)
```

### 9.9 Support & System Health
```
SupportTicket:
  tenant_id, submitted_by, subject, description, status: open|in_progress|resolved,
  priority, assigned_to (your internal team)

System health: uptime, job queue depth, error rate — surface existing
infra monitoring (Coolify/server metrics) rather than building a new
observability stack from scratch.
```

### 9.10 API surface
```
GET  /admin/tenants
POST /admin/tenants
PATCH /admin/tenants/:id
POST /admin/tenants/:id/suspend
POST /admin/tenants/:id/impersonate

GET  /admin/plans
POST /admin/subscriptions/webhook        (Stripe/gateway webhook receiver)

GET  /admin/analytics/usage
GET  /admin/support/tickets
PATCH /admin/support/tickets/:id

GET  /admin/api-keys
POST /admin/api-keys
DELETE /admin/api-keys/:id
```

### 9.11 Acceptance criteria
- [ ] A new tenant can be created, assigned a plan, and moves correctly through trial → active based on webhook events
- [ ] Suspending a tenant correctly blocks that tenant's staff/portal users from accessing the app (test: suspended tenant login attempt is rejected with a clear message, not a generic error)
- [ ] Feature flags correctly gate access to Phase 8's AI features per tenant plan
- [ ] Impersonation requires a reason, issues a properly scoped session, and produces an audit log entry every time — verify this cannot be bypassed
- [ ] Support tickets can be created (from a tenant) and managed (by your internal team) with status transitions
- [ ] Cross-tenant usage analytics correctly aggregate without leaking one tenant's data into another's report

---

## Existing Context

**Tenant.ts (Current Base Model)**
```typescript
import { Schema, model, Document, Types } from "mongoose";

export interface ITenant extends Document {
  name: string;
  nameNp?: string;
  code: string;
  subdomain: string;
  district?: string;
  province?: string;
  type: "rural" | "urban" | "sub-metropolitan" | "metropolitan";
  totalOffices: number;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
  themeConfig?: {
    primaryColor: string;
  };
  isActive: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true },
    nameNp: String,
    code: { type: String, required: true, unique: true, uppercase: true },
    subdomain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    district: String,
    province: String,
    type: { type: String, enum: ["rural","urban","sub-metropolitan","metropolitan"], default: "rural" },
    totalOffices: { type: Number, default: 9 },
    contactEmail: String,
    contactPhone: String,
    address: String,
    logoUrl: String,
    themeConfig: {
      primaryColor: { type: String, default: "#1C2434" } // Default tailwind brand color (or any specific hex)
    },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true },
);

export const Tenant = model<ITenant>("Tenant", tenantSchema);
```
