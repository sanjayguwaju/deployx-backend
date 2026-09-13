# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies (fallback to npm if pnpm is not preferred locally, but npm is standard)
RUN npm ci

# Copy source files
COPY . .

# Build the TypeScript project
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only package files for production install
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Start the application
EXPOSE 8081
CMD ["npm", "start"]
