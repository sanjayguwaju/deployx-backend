# PalikaOS Backend (API) 🇳🇵

PalikaOS is a next-generation, Multi-Tenant SaaS platform designed specifically for Local Governments (Municipalities/Rural Municipalities) in Nepal. It digitizes all core administrative, financial, and citizen-facing operations.

## Core Features

- **Multi-Tenant SaaS Architecture**: A single unified backend that serves multiple municipalities. Data is strictly isolated by `municipalityId` via subdomains (e.g., `kathmandu.palikaos.com`).
- **Comprehensive RBAC System**: 11+ system roles (Platform Admin, CAO, Ward Officer, Citizen, etc.) with granular module-level permissions for Create, Read, Update, Delete, and Approve actions.
- **Advanced White-Labeling**: Each municipality can customize the platform with their own branding, logo, and primary color palette via dynamic CSS variable injection.
- **Dynamic Tax Engine**: Configurable flat-rate or percentage-based tax rules for Property, Business, and Vehicle taxes, calculated dynamically.
- **Ghatana Darta (Vital Events)**: Full lifecycle registration (Birth, Death, Marriage, Migration) mapped to government standards.
- **SaaS Billing & eSewa Integration**: Automated monthly/yearly subscription plans (Basic, Premium) for municipalities with eSewa payment gateway support.
- **Public Citizen Portal**: Citizens can track complaints, service requests, and vital events securely using their tracking IDs.
- **Document Approvals & Sifaris**: Multi-stage digital document approval workflows (Draft -> CAO Approval -> PDF Generation).
- **Audit Logs**: Immutable tracking of all critical system actions.

## Technology Stack

- **Runtime**: Node.js & TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Cache**: Redis (via ioredis) for fast session and permission resolution
- **Authentication**: JWT (JSON Web Tokens) with refresh token rotation
- **Authorization**: CASL for dynamic, granular Role-Based Access Control (RBAC)
- **File Storage**: AWS S3 (via Multer)
- **PDF Generation**: Puppeteer (for generating official Sifaris and Certificates)
- **Documentation**: Swagger / OpenAPI 3.0

## Documentation Directory

To better understand the internal workings of PalikaOS, please refer to the following architectural and workflow documents located in the `docs/` folder:

- [Roles & Permissions (`docs/roles-permissions.md`)](./docs/roles-permissions.md): Details the 11+ system roles and their modular access scopes.
- [Tenant Onboarding (`docs/workflow-tenant-onboarding.md`)](./docs/workflow-tenant-onboarding.md): Covers the automated provisioning of new municipalities and the approval lifecycle.
- [Tenant Customization (`docs/workflow-tenant-customization.md`)](./docs/workflow-tenant-customization.md): Explains how unauthenticated branding and dynamic white-labeling works.
- [Platform Administration (`docs/workflow-platform-administration.md`)](./docs/workflow-platform-administration.md): Details super-admin features like cache invalidation, feature flags, and global tenant management.

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- AWS S3 Credentials (for file uploads)

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in the required values:

```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/palikaos
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1d
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=palikaos-uploads
FRONTEND_URL=http://localhost:5173
ESEWA_MERCHANT_ID=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
```

### 3. Installation & Run
```bash
# Install dependencies
npm install

# Seed the database with default roles, dummy municipalities, and test data
npm run seed

# Run in development mode
npm run dev

# Build for production
npm run build
npm start
```

## API Documentation
Once the server is running, the Swagger documentation is available at:
`http://localhost:5001/api-docs`
