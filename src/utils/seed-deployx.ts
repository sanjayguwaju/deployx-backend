import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";
import path from "path";

// Load Environment Variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { connectDatabase } from "../config/database";
import { Tenant } from "../models/Tenant";
import { Role } from "../models/Role";
import { User } from "../models/User";
import { Candidate } from "../models/Candidate";
import { Employer } from "../models/Employer";
import { Demand } from "../models/Demand";
import { Pipeline } from "../models/Pipeline";
import { Commission } from "../models/Commission";
import { ContractTemplate } from "../models/ContractTemplate";
import { Contract } from "../models/Contract";
import { Office } from "../models/Office";

// Ensure a safe clear
async function clearDatabase() {
  console.log("🧹 Clearing DeployX database...");
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  console.log("✅ Database cleared.");
}

async function seedDeployX() {
  await connectDatabase();
  const args = process.argv.slice(2);
  if (args.includes("--clear")) {
    await clearDatabase();
  }

  console.log("🌱 Seeding DeployX...");

  // 1. Tenant
  const tenant = await Tenant.create({
    name: "DeployX Recruitment Agency",
    code: "DEPLOYX",
    subdomain: "demo",
    contactEmail: "admin@deployx.com",
    isActive: true,
    status: "approved",
  });
  
  const office = await Office.create({
    tenantId: tenant._id,
    officeNumber: 1,
    officeName: "Headquarters",
    officeAddress: "Kathmandu, Nepal"
  });

  console.log("✓ Tenant & Office seeded");

  // 2. Roles
  const roles = await Role.insertMany([
    {
      tenantId: tenant._id,
      name: "Super Admin",
      slug: "super_admin",
      isSystem: true,
      level: 0,
      permissions: [{ module: "all", action: "manage" }],
    },
    {
      tenantId: tenant._id,
      name: "HR Manager",
      slug: "hr_manager",
      isSystem: true,
      level: 1,
      permissions: [
        { module: "candidates", action: "manage" },
        { module: "demands", action: "manage" },
        { module: "pipeline", action: "manage" },
      ],
    },
    {
      tenantId: tenant._id,
      name: "Agent",
      slug: "agent",
      isSystem: true,
      level: 2,
      permissions: [
        { module: "candidates", action: "create" },
        { module: "candidates", action: "read" },
      ],
    },
  ]);
  
  const adminRole = roles.find(r => r.slug === "super_admin")!;
  const hrRole = roles.find(r => r.slug === "hr_manager")!;
  const agentRole = roles.find(r => r.slug === "agent")!;

  console.log("✓ Roles seeded");

  // 3. Users
  const adminUser = await User.create({
    name: "System Admin",
    email: "admin@deployx.com",
    password: "Password123", // Pre-hashed by mongoose hook
    tenantId: tenant._id,
    roles: [adminRole._id],
    rolesSlugs: ["super_admin"],
    isActive: true,
  });

  const hrUser = await User.create({
    name: "Sarah (HR Manager)",
    email: "hr@deployx.com",
    password: "Password123",
    tenantId: tenant._id,
    roles: [hrRole._id],
    rolesSlugs: ["hr_manager"],
    isActive: true,
  });

  const agentUser = await User.create({
    name: "Ramesh (Sub-Agent)",
    email: "agent@deployx.com",
    password: "Password123",
    tenantId: tenant._id,
    roles: [agentRole._id],
    rolesSlugs: ["agent"],
    isActive: true,
  });

  console.log("✓ Users seeded (admin@, hr@, agent@ : Password123)");

  // 4. Employers
  const employersData = [
    { name: "Global Construction LLC", country: "UAE", industry: "Construction" },
    { name: "Saudi Aramco Services", country: "Saudi Arabia", industry: "Oil & Gas" },
    { name: "Qatar Airways Hospitality", country: "Qatar", industry: "Hospitality" },
    { name: "Majestic Security Co.", country: "Malaysia", industry: "Security" }
  ];

  const employers = [];
  for (const emp of employersData) {
    const e = await Employer.create({
      tenantId: tenant._id,
      companyName: emp.name,
      country: emp.country,
      industry: emp.industry,
      createdBy: adminUser._id,
      contactPersons: [{
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number()
      }]
    });
    employers.push(e);
  }

  console.log("✓ Employers seeded");

  // 5. Demands
  const demands = [];
  for (const emp of employers) {
    const d = await Demand.create({
      tenantId: tenant._id,
      trackingNumber: `DMD-${faker.string.alphanumeric(6).toUpperCase()}`,
      employerId: emp._id,
      employerName: emp.companyName,
      country: emp.country,
      profession: faker.helpers.arrayElement(["Scaffolding Worker", "Security Guard", "Cleaner", "Plumber", "Electrician", "Chef"]),
      quantityRequired: faker.number.int({ min: 10, max: 100 }),
      salary: { amount: faker.number.int({ min: 1000, max: 3000 }), currency: "AED" },
      status: "approved",
      createdBy: hrUser._id,
      approvedBy: adminUser._id,
    });
    demands.push(d);
  }
  
  console.log("✓ Demands seeded");

  // 6. Candidates & Pipeline
  const candidates = [];
  for (let i = 0; i < 30; i++) {
    const isMale = Math.random() > 0.2;
    const candidate = await Candidate.create({
      tenantId: tenant._id,
      officeId: office._id,
      firstName: faker.person.firstName(isMale ? 'male' : 'female'),
      lastName: faker.person.lastName(),
      passportNumber: faker.string.alphanumeric(9).toUpperCase(),
      phone: faker.phone.number(),
      gender: isMale ? "male" : "female",
      profession: faker.helpers.arrayElement(["Scaffolding Worker", "Security Guard", "Cleaner", "Plumber", "Electrician", "Chef"]),
      status: faker.helpers.arrayElement(["registered", "selected", "medical"]),
      isVerified: Math.random() > 0.5,
    });
    candidates.push(candidate);
    
    // Assign to a random demand Pipeline
    const demand = faker.helpers.arrayElement(demands);
    const stages: any[] = ["applied", "shortlisted", "interview", "selected", "medical", "visa", "ticket", "deployment"];
    const stage = faker.helpers.arrayElement(stages);
    
    await Pipeline.create({
      tenantId: tenant._id,
      candidateId: candidate._id,
      demandId: demand._id,
      stage: stage,
      stageHistory: [{ stage: "applied", enteredAt: new Date(), enteredBy: hrUser._id }],
      assignedTo: hrUser._id
    });
  }

  console.log("✓ Candidates & Pipelines seeded");

  // 7. Contracts & Commissions
  const template = await ContractTemplate.create({
    tenantId: tenant._id,
    name: "Standard Overseas Employment Contract",
    applicableTo: "employment_contract",
    templateBody: "<h1>Employment Contract</h1><p>This contract is made between {{companyName}} and {{candidateName}}.</p>"
  });

  for (let i = 0; i < 5; i++) {
    const candidate = candidates[i];
    const demand = demands[i % demands.length];
    
    await Contract.create({
      tenantId: tenant._id,
      templateId: template._id,
      candidateId: candidate._id,
      employerId: demand.employerId,
      demandId: demand._id,
      signatureStatus: "draft",
      signatures: []
    });

    // Agent generated this candidate
    await Commission.create({
      tenantId: tenant._id,
      agentId: agentUser._id,
      candidateId: candidate._id,
      demandId: demand._id,
      amount: faker.number.int({ min: 100, max: 500 }),
      currency: "USD",
      status: faker.helpers.arrayElement(["pending", "paid"])
    });
  }

  console.log("✓ Contracts & Commissions seeded");

  console.log("🎉 DeployX Seeding completed successfully!");
  process.exit(0);
}

seedDeployX().catch(console.error);
