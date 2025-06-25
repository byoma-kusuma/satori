# Multi-stage build for optimized production image
FROM oven/bun:alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files for dependency installation
COPY package.json bun.lock* ./

# Install all dependencies (including better-sqlite3 for build)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Production stage
FROM oven/bun:alpine AS production

# Install runtime dependencies and build tools needed for Better Auth CLI
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Copy all pre-built node_modules from builder (avoids recompilation)
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build arguments
ARG NODE_ENV=production
ARG PORT=3000

# Environment variables
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}

# Expose port
EXPOSE ${PORT}

# Start application
CMD ["bun", "run", "start"]