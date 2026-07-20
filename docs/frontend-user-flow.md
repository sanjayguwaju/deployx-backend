# Frontend User Flow

This document maps out the end-to-end user journeys across the PalikaOS frontend application, detailing how users navigate through onboarding, authentication, role-based dashboards, and the public citizen portal.

## 1. Domain Resolution & Initial Visit
The frontend dynamically determines the user's intent based on the URL structure (subdomain parsing in `App.tsx`).

### A. Naked Domain (`palikaos.com` or `www.palikaos.com`)
- **Flow:** If the user visits the root domain without a municipality subdomain, they are immediately presented with the `RegisterMunicipality` component.
- **Purpose:** This acts as the SaaS landing page for new local governments to sign up and request a workspace.

### B. Subdomain (`kathmandu.palikaos.com`)
- **Flow:** If a subdomain is detected, the app renders the specific municipality's `LandingPage`. 
- **Branding Check:** The frontend fires a request to `/api/v1/system/tenant/:subdomain/branding`. Before the user even logs in, the login page is injected with the municipality's custom logo and `primaryColor`.

## 2. Onboarding Flow (New Municipality)
1. **Action:** A representative visits the naked domain or `/register`.
2. **Form Entry:** They fill out the SaaS registration form (Municipality Name, desired Subdomain, Admin Name, Admin Email, Password).
3. **Submission:** Upon submission, the API creates the tenant in a `"pending"` state. 
4. **Feedback:** The UI displays a success message informing the user that their workspace is pending verification by the platform administration team. They cannot log in yet.

## 3. Authentication Flow
1. **Action:** An approved user visits `/signin` on their specific subdomain.
2. **Login:** They enter their email and password.
3. **Token Issuance:** The backend responds with an Access Token (stored in memory/headers or secure cookies) and a Refresh Token (HTTP-only cookie).
4. **RBAC Hydration:** The `AuthContext` fetches the user's profile and their specific Roles/Permissions, hydrating the `@casl/react` abilities in the frontend.
5. **Redirection:** The user is pushed to the secure `/dashboard` route.

## 4. Protected Dashboard Navigation
Once inside the `AppLayout`, the user's experience is strictly governed by their roles.

### Platform Admin (Super Admin)
- **Menu Visibility:** Sees the **"Tenants Admin"** (`/system/tenants`) menu.
- **Actions:** Can view all pending municipalities, click "Approve" to activate them, or "Reject" to suspend them. Also manages global Feature Flags.

### Municipality Admin (CAO)
- **Menu Visibility:** Sees all internal modules (Users, Roles, Citizens, Registrations, Approvals) and Department Dashboards.
- **Customization:** Has access to **Settings > Branding** (`/settings/branding`) to dynamically update their logo and color scheme.
- **Restrictions:** Cannot see the "Tenants Admin" menu.

### Department Head / Ward Officer
- **Menu Visibility:** The `AppSidebar` dynamically hides menus they lack access to. For example, a Health Officer will only see the `departments/health` dashboard and related records. If they attempt to force-navigate to `/users`, the `ProtectedRoute` component will bounce them back or show a 403 screen.

## 5. Public Citizen Portal Flow
- **Endpoint:** `/citizen/track`
- **Flow:** Citizens do not need to log in to track their requests. They navigate to the public tracking page, input their Tracking ID (e.g., for a Complaint, Sifaris, or Vital Event), and view the real-time status of their application based on the backend's document approval lifecycle.
