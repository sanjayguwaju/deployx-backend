# Tenant Onboarding Workflow

The tenant onboarding process in PalikaOS allows new local governments (Municipalities) to register for a workspace on the platform. The process is fully automated for provisioning but requires manual approval from a Platform Administrator to go live.

## 1. Registration Request
- **Endpoint:** `POST /api/v1/onboarding/register`
- **Controller:** `onboarding.controller.ts`

When a new municipality submits the registration form, the system performs the following validations:
1. **Subdomain Check:** Verifies that the requested subdomain (e.g., `kathmandu`) is unique.
2. **Admin Email Check:** Verifies that the provided admin email does not already exist across the entire platform.

## 2. Automated Provisioning
Once validations pass, the system automatically provisions the workspace:

1. **Municipality Creation:** A new `Municipality` record is created. By default, it is assigned a `status` of `"pending"` and a `type` of `"rural"` with a default of 9 wards.
2. **Wards Generation:** 9 `Ward` documents are automatically generated and linked to the new `municipalityId`.
3. **Roles Seeding:** The core system roles (e.g., Platform Admin, CAO, Ward Officer) are duplicated from the master template and assigned to this specific municipality.
4. **Admin Account Creation:** The initial administrator account is created using the provided email and password. This user is automatically assigned the `platform_admin` role scoped to their new workspace.

## 3. Audit Logging
An `AuditLog` entry is generated to record the creation of the tenant, including the IP address of the requester.

## 4. Platform Admin Approval
Because the new tenant is created with a `"pending"` status, users cannot immediately log in or use the platform.
1. The **Platform Administrator** (Master Admin) logs into their global dashboard.
2. They navigate to the **Tenants Admin** panel.
3. They review the requested municipality and change the status from `"pending"` to `"approved"`.
4. Once approved, the new Municipality Admin can log in at their subdomain and begin configuring their workspace.
