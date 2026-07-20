# Platform Administration Workflow

The Platform Administrator (or Super Admin) is a global role that sits above individual municipalities. This user is responsible for managing the overarching infrastructure, approving new tenants, and controlling system-wide cache and feature settings.

All endpoints described here are protected by a strict Role-Based Access Control (RBAC) middleware that ensures `req.user.roles.includes("platform_admin")`.

## 1. Tenant Management
- **Endpoints:**
  - `GET /api/v1/system/tenants` (List all tenants)
  - `PUT /api/v1/system/tenants/:id/status` (Update tenant status)
- **Controller:** `system.controller.ts`

### Workflow
1. The Platform Admin navigates to the **Tenants Admin** dashboard on the frontend.
2. The frontend requests the full list of all `Municipality` records, sorted by registration date.
3. The Admin can review pending requests. If they click **Approve**, the frontend sends a `PUT` request with `{ status: "approved" }`.
4. Once the database updates the status to `"approved"`, the municipality's administrators and citizens can begin logging in and using the platform.
5. The Admin can also **Reject** or **Revoke** (suspend) a tenant by updating the status to `"rejected"`. This immediately locks out users of that tenant from authenticating.

## 2. System Settings & Feature Flags
- **Endpoints:** `/api/v1/feature-flags`
- **Controller:** `feature-flags.controller.ts` (Note: Global flags apply across all tenants)

The Platform Admin has the ability to toggle global feature flags. These flags can control whether certain experimental modules (e.g., a new "Tax Engine" or "Disaster Incident" module) are visible to the municipalities. 

## 3. Cache Management (Redis)
- **Endpoints:**
  - `GET /api/v1/system/redis` (Get stats)
  - `POST /api/v1/system/redis/clear` (Invalidate cache)

Because PalikaOS is a high-traffic SaaS application, it heavily utilizes Redis for caching user sessions, RBAC permissions, and API responses. 

### Cache Invalidation Workflow
If a critical security update occurs, or if roles/permissions get out of sync, the Platform Admin can trigger a manual cache invalidation:
1. The admin sends a request to `/api/v1/system/redis/clear` with a payload specifying the `target` (e.g., `"permissions"`, `"sessions"`, or `"all"`).
2. The backend uses `redis.keys()` to match the specific pattern (e.g., `permissions:role:*`). It strictly avoids using `flushdb` so that background BullMQ job queues are not accidentally wiped out.
3. The keys are deleted via `redis.del()`, forcing all subsequent API requests across all tenants to fetch fresh data directly from MongoDB.
