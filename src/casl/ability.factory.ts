import {
  AbilityBuilder,
  MongoAbility,
  createMongoAbility,
  ForcedSubject,
} from "@casl/ability";
import { AuthUser, SystemRole, PermissionAction, CaslSubject } from "../types";
import { IRole } from "../models/Role";

// ─── CASL Ability Type ──────────────────────────────────────────────────────
export type Actions = PermissionAction;
export type Subjects = CaslSubject | ForcedSubject<CaslSubject>;
export type AppAbility = MongoAbility<[Actions, Subjects]>;

// ─── Subject detection ──────────────────────────────────────────────────────
// We use the __caslSubjectType__ field on plain objects instead of class names,
// avoiding mutation of RSC-incompatible objects.
function detectSubjectType(subject: Subjects): CaslSubject {
  if (typeof subject === "string") return subject as CaslSubject;
  if (typeof subject === "object" && subject !== null) {
    const typed = subject as unknown as Record<string, unknown>;
    if (typed.__caslSubjectType__) return typed.__caslSubjectType__ as CaslSubject;
    // Fallback: check _type hint
    if (typed._type) return typed._type as CaslSubject;
  }
  return "all";
}

// ─── Tag a plain object with its CASL subject type ─────────────────────────
// Always spread to avoid mutation (RSC compatible).
export function tag<T extends object>(type: CaslSubject, obj: T): T & { __caslSubjectType__: CaslSubject } {
  return { ...obj, __caslSubjectType__: type };
}

// ─── Ability Factory ────────────────────────────────────────────────────────
export function buildAbility(user: AuthUser, permissions: { module: string; action: string }[]): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  const roleSet = new Set(user.roles);

  // Enforce dashboard_overview isolation
  cannot("read", "DashboardAnalytics", { type: "overview" } as any);

  // Map frontend module slugs (snake_case) to Backend CaslSubjects (PascalCase)
  const frontendModuleToSubjectMap: Record<string, CaslSubject[]> = {
    dashboard: ["Dashboard", "DashboardAnalytics"],
    rbac: ["Role"],
    users: ["User"],
    candidates: ["Candidate"],
    employers: ["Employer"],
    demands: ["Demand"],
    pipelines: ["Pipeline"],
    tasks: ["Task"],
    medical: ["Medical"],
    visa: ["Visa"],
    ticket: ["Ticket"],
    deployment: ["Deployment"],
    calendar: ["Calendar"],
    employer_portal: ["EmployerPortal"],
    candidate_portal: ["CandidatePortal"],
    agent_portal: ["AgentPortal"],
    contracts: ["Contract"],
    contract_templates: ["ContractTemplate"],
    communications: ["Notification"], // Notification is the subject for comms dispatch
    communication_templates: ["CommunicationTemplate"],
    invoices: ["Invoice"],
    expenses: ["Expense"],
    commissions: ["Commission"],
    licenses: ["License"],
    compliance_checks: ["ComplianceCheck"],
    reports: ["ReportDefinition"],
    report_definitions: ["ReportDefinition"],
    ai: ["AI"],
    superadmin: ["Tenant", "Plan", "Subscription", "SupportTicket", "ApiKey"],
    complaints: ["Complaint"],
    registration: ["Registration"],
    correspondence: ["Correspondence"],
    documents: ["Document", "ApprovableDocument"],
    notifications: ["Notification"],
    audit: ["AuditLog"],
    health: ["HealthPost", "HealthInventory"],
    education: ["School", "SchoolPerformance", "EducationInventory"],
    infrastructure: ["InfraProject", "InfraMilestone", "InfraPayment"],
    agriculture: ["LivestockRecord", "AgricultureInventory"],
    finance: ["Invoice", "Expense", "Commission", "BudgetAllocation", "RevenueCollection", "LedgerEntry"],
    hr: ["Pipeline", "Task", "Medical", "Visa", "Ticket", "Deployment", "Calendar", "License", "ComplianceCheck"],
    administrative: ["Office", "AdminDocument", "AdminSignature"],
    disaster_management: ["DisasterIncident", "DamageAssessment", "ReliefApplication"],
    inventory: ["InventoryItem", "InventoryTransaction", "Distribution"],
    feature_flags: ["FeatureFlag"],
  };

  // Build permissions from cached permissions array
  for (const perm of permissions) {
    // Map the string stored in the database to the actual backend CaslSubject(s)
    const subjects = frontendModuleToSubjectMap[perm.module] || [perm.module as CaslSubject];
    for (const subject of subjects) {
      can(perm.action as Actions, subject);
    }
  }

  // ── Identity-based supplementary rules ──────────────────────────────────────

  // Phase 1 specific role constraints
  if (roleSet.has("hr") || roleSet.has("recruiter")) {
    can("manage", "Candidate", { officeId: user.officeId } as any);
    can("read", "Employer");
    can("update", "Employer"); // for agreement upload
    can("manage", "Demand");
    can("manage", "Pipeline");
    can("manage", "Task");
    can("manage", "Medical");
    can("manage", "Visa");
    can("manage", "Ticket");
    can("manage", "Deployment");
    can("read", "Calendar");
  }
  
  if (roleSet.has("finance")) {
    can("read", "Candidate");
    can("read", "Employer");
    can("read", "Demand");
    can("read", "Pipeline");
    can("read", "Medical");
    can("read", "Visa");
    can("read", "Ticket");
    can("read", "Deployment");
    can("read", "Calendar");
  }

  // Phase 4 - Portal Role Constraints
  if (roleSet.has("employer")) {
    can("read", "EmployerPortal");
    // Explicitly allow reading Employer domain if it's their own, etc.
    can("read", "Employer", { _id: user.employerId } as any);
  }

  if (roleSet.has("candidate")) {
    can("read", "CandidatePortal");
    can("read", "Candidate", { _id: user.candidateId } as any);
  }

  if (roleSet.has("agent")) {
    can("read", "AgentPortal");
  }

  // Self-service reads for all users
  can("read", "Notification", { recipientId: user.id } as any);
  if (user.email) {
    can("read", "Demand", { "applicantEmail": user.email } as any);
    can("read", "Complaint", { "complainantPhone": user.email } as any);
  }

  return build({ detectSubjectType });
}


