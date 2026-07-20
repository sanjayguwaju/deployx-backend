# Roles & Permissions Documentation

The PalikaOS system uses a hybrid RBAC/ABAC (Role-Based and Attribute-Based Access Control) architecture powered by CASL. Users are assigned **Roles**, which dictate their base permissions. These permissions are then evaluated at runtime against specific resources (like a Ward or a specific Citizen) to enforce strict data isolation.

Here are all the system roles configured by default and their corresponding permissions.

---

## 1. Platform Administrator
- **Name (NP):** प्लेटफर्म प्रशासक
- **Slug:** `platform_admin`
- **Level:** 0 (Highest)
- **Permissions:**
  - `manage` on `all` modules.
  - **Scope:** Full access across all municipalities in the multi-tenant system.
- **Test Account:**
  - **Email:** `superadmin@platform.gov.np`
  - **Password:** `Super@1234`
  - **Route:** `/superadmindashboard`
  - **Expected UI:** Full access across the entire multi-tenant platform. All menus and actions visible.

## 2. Municipality Admin
- **Name (NP):** नगरपालिका प्रशासक
- **Slug:** `municipality_admin`
- **Level:** 1
- **Permissions:**
  - `manage` on `all` modules.
  - **Scope:** Full access, but strictly scoped to their assigned Municipality ID. Cannot access data from other municipalities.
- **Test Account:**
  - **Email:** `admin@demo.gov.np`
  - **Password:** `Admin@1234`
  - **Route:** `/administrator`
  - **Expected UI:** Full access within the municipality. All sidebar menus (including Users & Roles) and all action buttons (New, Edit, Delete) are visible.

## 3. Section Head
- **Name (NP):** शाखा प्रमुख
- **Slug:** `section_head`
- **Level:** 2
- **Permissions:** 
  - `create`, `read`, `update`, `approve` on the following modules:
    - `citizens`
    - `correspondence`
    - `service_requests`
    - `registration`
    - `complaints`
    - `dashboard`
  - **Scope:** Department-level operations across the municipality.
- **Test Account:**
  - **Email:** `section@demo.gov.np`
  - **Password:** `Section@1234`
  - **Route:** `/dashboard`
  - **Expected UI:** Most menus are visible, but `Users` and `Roles` are hidden. Action buttons in tables will be visible for Create, Read, Update, and Approve.

## 4. Ward Officer
- **Name (NP):** वडा अधिकृत
- **Slug:** `ward_officer`
- **Level:** 3
- **Permissions:**
  - `create`, `read`, `update` on the following modules:
    - `citizens`
    - `service_requests`
    - `registration`
    - `complaints`
    - `correspondence`
  - `read` on `dashboard`
  - **Scope:** Can only read, create, or update records that belong to their specific `wardId`.
- **Test Account:**
  - **Email:** `ward1@demo.gov.np`
  - **Password:** `Ward1@1234`
  - **Route:** `/dashboard`
  - **Expected UI:** Access to operational menus (Citizens, Registration, etc.), but strict UI restrictions based on Ward ownership (ABAC). `Users` and `Roles` are hidden.

## 5. Staff
- **Name (NP):** कर्मचारी
- **Slug:** `staff`
- **Level:** 4
- **Permissions:**
  - `read` on `dashboard`
  - `read` on `notifications`
  - **Scope:** Basic access for general municipality staff. Usually combined with custom resource assignments (like being assigned to a specific service request).
- **Test Account:**
  - **Email:** `staff@demo.gov.np`
  - **Password:** `Staff@1234`
  - **Route:** `/dashboard`
  - **Expected UI:** Severely restricted sidebar displaying only `Dashboard` and `Notifications`. Attempting to manually navigate to `/correspondence` will trigger the ProtectedRoute component and redirect to the dashboard.

## 6. Citizen
- **Name (NP):** नागरिक
- **Slug:** `citizen`
- **Level:** 5
- **Permissions:**
  - `create` and `read` on `service_requests`
  - `create` on `complaints`
  - **Scope:** Strictly limited to reading their own submitted service requests and submitting new applications or grievances.
- **Test Account:**
  - **Email:** `citizen@demo.gov.np`
  - **Password:** `Citizen@1234`
  - **Route:** `/citizen/track`
  - **Expected UI:** Only modules pertinent to the citizen (e.g. Service Requests, Complaints) are visible. Only action buttons on their *own* requests are visible.

---

> [!TIP]
> **Custom Roles:** The system also supports dynamic, custom roles. You can create custom roles via the `POST /api/v1/roles` endpoint and assign specific modules and actions. Custom roles will automatically be picked up by the CASL `AbilityFactory` during JWT validation.
