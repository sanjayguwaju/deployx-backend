import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { AppAbility } from "../casl/ability.factory";

// ─── System Roles ──────────────────────────────────────────────────────────────
export type SystemRole =
  | "platform_admin"
  | "tenant_admin"
  | "section_head"
  | "ward_officer"
  | "staff"
  | "candidate"
  // Phase 1 roles
  | "hr"
  | "recruiter"
  | "employer"
  | "finance"
  | "agent";

// ─── Module Slugs ──────────────────────────────────────────────────────────────
export const MODULES = [
  "offices", "candidates", "employers", "demands", "pipelines", "tasks", "medical", "visa", "ticket", "deployment", "calendar", "documents", "correspondence",
  "employer_portal", "candidate_portal", "agent_portal",
  "contracts", "contract_templates", "communications", "communication_templates",
  "finance", "invoices", "expenses", "commissions",
  "compliance", "licenses", "compliance_checks",
  "analytics", "reports", "report_definitions",
  "ai",
  "superadmin", "tenants", "plans", "subscriptions", "support_tickets", "api_keys",
  "service_requests", "registration", "complaints",
  "portal", "dashboard", "hr", "finance", "tax",
  "meetings", "budget", "assets", "procurement",
  "projects", "reports", "rbac", "audit", "notifications", "feature_flags",
  // Phase 2 — Department modules
  "health", "health_inventory",
  "education", "education_inventory",
  "infrastructure", "infra_milestones",
  "agriculture", "agriculture_inventory",
  "livestock",
  "disaster_management", "relief_applications",
  "administrative", "admin_signatures",
  "finance_ledger",
  "approvals",
  // Phase 3 — Budget & Infra depth
  "budget", "revenue", "infra_payments",
  "dashboard_overview", "dashboard_health", "dashboard_education",
  "dashboard_infrastructure", "dashboard_agriculture",
  "dashboard_disaster_management", "dashboard_finance"
] as const;
export type ModuleSlug = (typeof MODULES)[number];

// ─── Permission Actions ────────────────────────────────────────────────────────
export type PermissionAction = "create" | "read" | "update" | "delete" | "approve" | "export" | "manage";

// ─── CASL Subjects ─────────────────────────────────────────────────────────────
export type CaslSubject =
  | "Office" | "Candidate" | "Employer" | "Demand" | "Pipeline" | "Task" | "Medical" | "Visa" | "Ticket" | "Deployment" | "Calendar" | "Document" | "Correspondence"
  | "EmployerPortal" | "CandidatePortal" | "AgentPortal"
  | "Contract" | "ContractTemplate" | "CommunicationTemplate"
  | "Invoice" | "Expense" | "Commission"
  | "License" | "ComplianceCheck"
  | "ReportDefinition"
  | "AI"
  | "Tenant" | "Plan" | "Subscription" | "SupportTicket" | "ApiKey"
  | "Demand" | "Registration" | "Complaint"
  | "Notification" | "AuditLog" | "User" | "Role"
  | "Dashboard" | "FeatureFlag"
  // Phase 2 — Health
  | "HealthPost" | "HealthInventory"
  // Phase 2 — Education
  | "School" | "SchoolPerformance" | "EducationInventory"
  // Phase 2 — Infrastructure
  | "InfraProject" | "InfraMilestone"
  // Phase 2 — Agriculture
  | "LivestockRecord" | "AgricultureInventory"
  // Phase 2 — Shared Inventory
  | "InventoryItem" | "InventoryTransaction" | "Distribution"
  // Phase 2 — Disaster
  | "DisasterIncident" | "DamageAssessment" | "ReliefApplication"
  // Phase 2 — Administrative
  | "AdminDocument" | "AdminSignature"
  // Phase 2 — Finance
  | "LedgerEntry"
  // Phase 2 — Approvals
  | "ApprovableDocument"
  // Phase 3 — Depth & Analytics
  | "BudgetAllocation" | "RevenueCollection" | "InfraPayment" | "DashboardAnalytics"
  | "Finance" | "VitalEvent" | "TaxRule"
  | "all";

// ─── Authenticated Request ─────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  officeId?: string;
  employerId?: string;
  candidateId?: string;
  roles: SystemRole[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  ability?: AppAbility;
}

// ─── JWT Payload ───────────────────────────────────────────────────────────────
export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  officeId?: string;
  roles: SystemRole[];
}

// ─── API Envelope ──────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}
