# Multi-stage build for optimized production image
FROM oven/bun:alpine AS builder

# Install build dependencies and pnpm
RUN apk add --no-cache python3 make g++ nodejs npm && \
    npm install -g pnpm@9.0.0

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all packages (needed for workspace resolution)
COPY packages ./packages

# Copy server app
COPY apps/server ./apps/server

# Remove .env file from the copied source (we'll use environment variables from docker-compose)
RUN rm -f apps/server/.env

# Install dependencies using pnpm (handles workspaces correctly)
# Use --shamefully-hoist to ensure all dependencies are accessible
RUN pnpm install --frozen-lockfile --shamefully-hoist --filter server

# Production stage
FROM oven/bun:alpine AS production

# Install runtime dependencies and pnpm for Better Auth CLI
RUN apk add --no-cache python3 make g++ nodejs npm && \
    npm install -g pnpm@9.0.0

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy packages directory (needed for workspace resolution at runtime)
COPY packages ./packages

# Copy server app
COPY apps/server ./apps/server

# Remove .env file (we use environment variables from docker-compose)
RUN rm -f apps/server/.env

# Copy node_modules from builder (includes workspace dependencies)
COPY --from=builder /app/node_modules ./node_modules

# Set working directory to server app
WORKDIR /app/apps/server

# Build arguments
ARG NODE_ENV=production
ARG PORT=3000

# Environment variables
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}

# Expose port
EXPOSE ${PORT}

# Start application with Bun
CMD ["bun", "run", "start"]
