# UI Flow: Tenant Management & Approval

This document outlines the step-by-step User Interface (UI) journey for a **Platform Admin (Super Admin)** when managing and approving new municipality tenants on PalikaOS.

## 1. Accessing the Tenants Dashboard
1. **Login:** The Platform Admin navigates to the naked domain or administrative portal and logs in using their super admin credentials (e.g., `superadmin@platform.gov.np`).
2. **Navigation:** Upon successful login, the `AppSidebar` detects the `platform_admin` role and reveals the **"Tenants Admin"** menu item under the System section.
3. **Route:** The admin clicks "Tenants Admin" and is navigated to the `/system/tenants` route.

## 2. Reviewing Tenant Applications
1. **Data Fetching:** The `TenantsAdmin.tsx` component mounts and fetches the list of all registered municipalities via `GET /api/v1/system/tenants`.
2. **Table View:** The UI presents a comprehensive data table displaying:
   - **Name:** The full name of the local government (e.g., Kathmandu Metropolitan City).
   - **Subdomain:** The requested tenant URL (e.g., `kathmandu.demo.com`).
   - **Type:** Rural, Urban, Sub-Metropolitan, or Metropolitan.
   - **Registered Date:** When the SaaS registration form was submitted.
   - **Status Badge:** A color-coded pill indicating the current state:
     - 🟡 **PENDING:** Yellow background. Awaiting review.
     - 🟢 **APPROVED:** Green background. Active and live.
     - 🔴 **REJECTED:** Red background. Suspended or denied.

## 3. The Approval Workflow (Actioning a Request)
When a municipality is in the **PENDING** state, the UI exposes action buttons in the rightmost column:

### A. Approving a Tenant
1. **Action:** The admin clicks the green **Approve** button.
2. **Processing:** The button enters a disabled/loading state to prevent double-clicking.
3. **API Call:** The frontend sends a request to `PUT /api/v1/system/tenants/:id/status` with the payload `{ status: "approved" }`.
4. **UI Update:** Upon a successful `200 OK` response:
   - A success toast notification appears: *"Tenant marked as approved"*.
   - The status badge in the table instantly changes from PENDING (Yellow) to APPROVED (Green).
   - The action buttons change: The "Approve" button disappears, and a red "Revoke" button appears in its place.
5. **Result:** The municipality's CAO can now navigate to their subdomain and log in.

### B. Rejecting / Suspending a Tenant
1. **Action:** If the application is invalid, or if an active tenant needs to be suspended (e.g., for non-payment), the admin clicks the red **Reject** or **Revoke** button.
2. **API Call:** The frontend sends a request to `PUT /api/v1/system/tenants/:id/status` with `{ status: "rejected" }`.
3. **UI Update:** 
   - A success toast appears confirming the rejection.
   - The status badge changes to REJECTED (Red).
   - The action buttons change to offer an "Approve" button, allowing the admin to reinstate the tenant in the future.
4. **Result:** Any user attempting to log into that municipality's subdomain will be blocked, as the backend will refuse authentication for rejected tenants.
