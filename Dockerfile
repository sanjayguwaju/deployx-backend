# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Force development environment so devDependencies (like typescript) are installed
# even if the deployment platform injects NODE_ENV=production at build time.
ENV NODE_ENV=development

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies (fallback to npm if pnpm is not preferred locally, but npm is standard)
RUN npm ci --ignore-scripts

# Copy source files
COPY . .

# Build the TypeScript project
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Force production environment for runtime
ENV NODE_ENV=production

# Copy only package files for production install
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install only production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

ENV PORT=8081

# Start the application
EXPOSE 8081
EXPOSE 3000
EXPOSE 4000
CMD ["npm", "start"]
