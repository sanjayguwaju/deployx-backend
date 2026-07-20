# DeployX — Phase 0: Foundation (Schema Delta & Rename Pass)

This document is the **Phase 0 implementation plan** for adapting the Palika OS codebase into DeployX. It should be used as the context and scope boundary for an AI-assisted implementation session (e.g., using Claude Code).

## Goal Description
The objective of Phase 0 is to transform the foundational Palika OS schema and entity models to align with the DeployX domain (Overseas Recruitment Agency CRM), without breaking the existing architecture or CASL/RBAC access patterns. This is a "re-domain-ing" pass rather than a from-scratch rewrite.

## User Review Required
> [!IMPORTANT]
> - Please review the schema mapping below to ensure the Palika OS fields are mapped correctly to the DeployX domain.
> - Confirm whether you want me to execute this phase immediately, or if you will hand this off to Claude Code separately.
> - We need the exact list of the 11 roles from section §31 of the spec to complete the role mapping. I have added placeholders.

## 1. Schema Delta & Mapping Table

This mapping dictates how we will rename and restructure the existing Mongoose models in `deployx-frontend` (the Palika OS backend).

| Current Palika OS Model | Target DeployX Model | Notes |
|---|---|---|
| `Municipality.ts` | `Tenant.ts` | Represents an Agency. Fields like `totalWards` -> `totalOffices`. |
| `Ward.ts` | `Office.ts` | Represents a branch/office (Kathmandu, Dubai). Updates reference from `municipalityId` to `tenantId`. |
| `Citizen.ts` | `Candidate.ts` | Represents the job seeker. Needs renaming of `municipalityId` -> `tenantId`, `wardId` -> `officeId`. Replace `citizenshipNumber` with `passportNumber`, etc. |
| `ServiceRequest.ts` | `Demand.ts` | Represents a job demand from an Employer. Needs structural updates for the recruitment pipeline instead of citizen services. |
| `Role.ts` | `Role.ts` | Preserve model. Update the default role seeds/slugs to the 11 DeployX roles (e.g., Super Admin, Agency Owner, HR Manager, Recruiter, Employer, Candidate, etc.). Update `level` definitions. |
| `User.ts` | `User.ts` | Update references from `municipalityId`/`wardId` to `tenantId`/`officeId`. |

### Net-New Models (To be scaffolded)
* `Employer.ts`: Represents the foreign company making demands.
* (Future Phases will introduce `MedicalRecord.ts`, `VisaRecord.ts`, `Ticket.ts`, `Deployment.ts`).

## 2. Proposed Changes

Below is the file-by-file breakdown of changes for Phase 0.

### Backend (`deployx-frontend / palika-os-api`)

#### [MODIFY] `src/models/Municipality.ts` -> `src/models/Tenant.ts`
- Rename the model, file, and interface (`IMunicipality` -> `ITenant`).
- Rename fields specific to municipality (e.g., `totalWards` -> `totalOffices`).

#### [MODIFY] `src/models/Ward.ts` -> `src/models/Office.ts`
- Rename interface and model.
- Change `municipalityId` to `tenantId`.

#### [MODIFY] `src/models/Citizen.ts` -> `src/models/Candidate.ts`
- Change `municipalityId` -> `tenantId`.
- Change `wardId` -> `officeId`.
- Rename `firstNameNp`/`lastNameNp` to general secondary language or remove if unnecessary for DeployX.
- Rename `citizenshipNumber` -> `passportNumber`. Add fields for `passportExpiry`, etc., or keep it simple for Phase 0 and add them in Phase 1.

#### [MODIFY] `src/models/ServiceRequest.ts` -> `src/models/Demand.ts`
- Map this to handle Employer Demands.
- Change `applicantName` -> `employerName` (or ref to `Employer.ts` once created).

#### [MODIFY] `src/models/Role.ts` and `src/models/User.ts`
- Change `municipalityId` -> `tenantId`.
- Change `wardId` -> `officeId` (in `User.ts`).

#### [MODIFY] Controller/Service/Route naming (Iterative)
- Rename the standard CRUD controllers (`municipality.controller.ts` -> `tenant.controller.ts`, etc.) to match the new schema.
- Keep the existing CASL ability structures intact but update the slugs.

## 3. Execution Constraints for Claude Code
> [!TIP]
> - **No destructive rewrites**: Use the existing Mongoose + Express + CASL patterns. 
> - Do not change the overall folder structure (`src/models`, `src/controllers`, `src/routes`, `src/casl`).
> - Implement these changes as a reversible refactoring (e.g., simple find-and-replace for `municipalityId` -> `tenantId` across the backend).
> - Leave the frontend (`deployx-backend / tailadmin-react`) alone during this initial backend schema pass, except where type definitions are strictly shared.

## Verification Plan

### Automated Tests
- Run `npm run build` in the backend directory to ensure no TypeScript compilation errors after renaming.
- Run `npm run lint` to ensure code style compliance.

### Manual Verification
- Start the server using `npm run dev`.
- Ensure the Swagger documentation (`npm run swagger`) generates successfully and reflects the new endpoints (`/api/v1/tenants`, `/api/v1/candidates`, etc.).
- Ensure seeding scripts (`npm run seed`) can successfully populate the database with a test Tenant, Office, and User.
