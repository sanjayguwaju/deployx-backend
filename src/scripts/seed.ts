import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { Tenant } from "../models/Tenant";
import { Role } from "../models/Role";
import { User } from "../models/User";
import { Employer } from "../models/Employer";
import { Candidate } from "../models/Candidate";
import { Demand } from "../models/Demand";
import { Pipeline } from "../models/Pipeline";
import { ContractTemplate } from "../models/ContractTemplate";
import { Office } from "../models/Office";

async function seed() {
  console.log("Connecting to database...");
  await mongoose.connect(env.MONGODB_URI);
  console.log(`Connected to ${env.MONGODB_URI}`);

  console.log("Clearing existing data...");
  const db = mongoose.connection.db;
  if (db) {
    await db.collection("tenants").deleteMany({});
    await db.collection("roles").deleteMany({});
    await db.collection("users").deleteMany({});
    await db.collection("employers").deleteMany({});
    await db.collection("candidates").deleteMany({});
    await db.collection("demands").deleteMany({});
    await db.collection("pipelines").deleteMany({});
    await db.collection("contracttemplates").deleteMany({});
  }

  // 1. Create Master Tenant (DeployX Platform HQ)
  console.log("Creating Master Tenant...");
  const masterTenant = await Tenant.create({
    name: "DeployX HQ",
    code: "DEPLOYX",
    subdomain: "app",
    type: "urban",
    isActive: true,
  });

  // 1b. Create Client Agency Tenant
  console.log("Creating Agency Tenant...");
  const agencyTenant = await Tenant.create({
    name: "Global Recruitment Agency",
    code: "GRA",
    subdomain: "demo",
    type: "urban",
    isActive: true,
  });

  console.log("Creating agency office...");
  const office = await Office.create({
    tenantId: agencyTenant._id,
    name: "Main Branch",
    type: "headquarters",
    level: 1,
    officeNumber: 1
  });

  // 2. Create Roles
  console.log("Creating roles...");
  // Platform Admin (Global)
  const platformAdminRole = await Role.create({
    tenantId: masterTenant._id,
    name: "Platform Admin",
    slug: "platform_admin",
    description: "Full system access across platform",
    isSystem: true,
    level: 0,
    permissions: [{ module: "all", action: "manage" }],
  });

  // Tenant Admin (Agency Level)
  const tenantAdminRole = await Role.create({
    tenantId: agencyTenant._id,
    name: "Agency Admin",
    slug: "tenant_admin",
    description: "Full access within the agency",
    isSystem: true,
    level: 1,
    permissions: [{ module: "all", action: "manage" }],
  });

  const recruiterRole = await Role.create({
    tenantId: agencyTenant._id,
    name: "Recruiter",
    slug: "recruiter",
    description: "Manages candidates and demands",
    isSystem: true,
    level: 2,
    permissions: [
      { module: "candidates", action: "manage" },
      { module: "employers", action: "read" },
      { module: "demands", action: "manage" },
      { module: "pipelines", action: "manage" },
    ],
  });

  // 3. Create Users
  console.log("Creating users...");
  
  // Master Admin
  const adminUser = await User.create({
    tenantId: masterTenant._id,
    name: "System Administrator",
    email: "admin@deployx.com",
    password: "admin123",
    roles: [platformAdminRole._id],
    rolesSlugs: ["platform_admin"],
    isActive: true,
  });

  // Agency Admin
  const agencyAdminUser = await User.create({
    tenantId: agencyTenant._id,
    name: "Agency Owner",
    email: "admin@demo.com",
    password: "admin123",
    roles: [tenantAdminRole._id],
    rolesSlugs: ["tenant_admin"],
    isActive: true,
  });

  // Agency Recruiter
  const recruiterUser = await User.create({
    tenantId: agencyTenant._id,
    name: "John Recruiter",
    email: "john@demo.com",
    password: "admin123",
    roles: [recruiterRole._id],
    rolesSlugs: ["recruiter"],
    isActive: true,
  });

  // 4. Create Employers (Under Agency)
  console.log("Creating employers...");
  const employer1 = await Employer.create({
    tenantId: agencyTenant._id,
    companyName: "TechCorp Global",
    registrationNumber: "REG-12345",
    country: "United Arab Emirates",
    industry: "Information Technology",
    primaryContact: {
      name: "Jane Smith",
      email: "jane@techcorp.ae",
      phone: "+971-50-123-4567"
    },
    status: "active",
    kycStatus: "verified",
    createdBy: agencyAdminUser._id
  });

  const employer2 = await Employer.create({
    tenantId: agencyTenant._id,
    companyName: "BuildRight Construction",
    registrationNumber: "REG-98765",
    country: "Saudi Arabia",
    industry: "Construction",
    primaryContact: {
      name: "Ahmed Hassan",
      email: "ahmed@buildright.sa",
      phone: "+966-50-987-6543"
    },
    status: "active",
    kycStatus: "verified",
    createdBy: agencyAdminUser._id
  });

  // 5. Create Demands (Under Agency)
  console.log("Creating demands...");
  const demand1 = await Demand.create({
    tenantId: agencyTenant._id,
    employerId: employer1._id,
    trackingNumber: "DMD-TC-001",
    profession: "Software Engineer",
    quantityRequired: 10,
    salary: { amount: 8000, currency: "AED" },
    status: "approved",
    country: employer1.country,
    createdBy: agencyAdminUser._id
  });

  const demand2 = await Demand.create({
    tenantId: agencyTenant._id,
    employerId: employer2._id,
    trackingNumber: "DMD-BR-001",
    profession: "Civil Engineer",
    quantityRequired: 5,
    salary: { amount: 6000, currency: "SAR" },
    status: "approved",
    country: employer2.country,
    createdBy: agencyAdminUser._id
  });

  // 6. Create Candidates (Under Agency)
  console.log("Creating candidates...");
  const candidate1 = await Candidate.create({
    tenantId: agencyTenant._id,
    officeId: office._id,
    firstName: "Michael",
    lastName: "Johnson",
    email: "michael.j@example.com",
    phone: "+977-9800000001",
    passportNumber: "N1234567",
    profession: "Software Engineer",
    skills: ["React", "Node.js", "TypeScript"],
    status: "registered",
    createdBy: agencyAdminUser._id
  });

  const candidate2 = await Candidate.create({
    tenantId: agencyTenant._id,
    officeId: office._id,
    firstName: "David",
    lastName: "Smith",
    email: "david.s@example.com",
    phone: "+977-9800000002",
    passportNumber: "N7654321",
    profession: "Civil Engineer",
    skills: ["AutoCAD", "Project Management"],
    status: "registered",
    createdBy: agencyAdminUser._id
  });

  // 7. Create Pipelines (Under Agency)
  console.log("Creating pipelines...");
  await Pipeline.create({
    tenantId: agencyTenant._id,
    candidateId: candidate1._id,
    demandId: demand1._id,
    employerId: employer1._id,
    currentStage: "medical",
    status: "active",
    createdBy: agencyAdminUser._id
  });

  await Pipeline.create({
    tenantId: agencyTenant._id,
    candidateId: candidate2._id,
    demandId: demand2._id,
    employerId: employer2._id,
    currentStage: "visa",
    status: "active",
    createdBy: agencyAdminUser._id
  });

  // 8. Create Contract Templates (Under Agency)
  console.log("Creating contract templates...");
  await ContractTemplate.create({
    tenantId: agencyTenant._id,
    name: "Standard Employment Agreement",
    applicableTo: "employment_contract",
    templateBody: "This is a standard employment agreement for {{candidateName}} with {{employerName}}."
  });

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
