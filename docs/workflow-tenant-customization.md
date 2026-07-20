# Tenant Customization & Branding Workflow

PalikaOS supports extensive white-labeling, allowing each municipality to configure the platform to match their local government's identity. This includes custom logos, color schemes, and localization.

## 1. Unauthenticated Branding Fetch
- **Endpoint:** `GET /api/v1/system/tenant/:subdomain/branding`
- **Controller:** `system.controller.ts`

When a user visits a specific tenant's login page (e.g., `kathmandu.palikaos.com`), the frontend extracts the subdomain and fetches the branding configuration **before** the user logs in.

1. The backend looks up the `Municipality` by the provided `subdomain`.
2. It returns only public-safe information: `name`, `logoUrl`, and `themeConfig.primaryColor`.
3. The frontend injects this `primaryColor` into the CSS variables (e.g., `--color-brand-500`), instantly theming the login screen, buttons, and alerts to match the municipality's colors.

## 2. Authenticated Settings Management
- **Endpoint:** `PATCH /api/v1/system/tenant/settings`
- **Controller:** `system.controller.ts`

Once a user with the `municipality_admin` role (e.g., the Chief Administrative Officer) logs in, they have access to the **Settings > Branding** page.

1. **Authorization Check:** The endpoint verifies that `req.user.roles` includes `municipality_admin`. Users without this role receive a `403 Forbidden` error.
2. **Data Update:** The admin can upload a new logo (stored and passed as `logoUrl`) or select a new `primaryColor`.
3. **Database Update:** The backend uses `findByIdAndUpdate` to modify the specific `Municipality` document linked to the `req.user.municipalityId`. It updates the `$set` fields dynamically.

## 3. Real-Time Application
Because the branding configuration is tied to the Tenant Context (managed via React Context on the frontend and Mongoose Tenant Plugin on the backend), changes made by the admin are immediately reflected across all users currently logged into that specific municipality's workspace.
