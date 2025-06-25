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

# Install only runtime dependencies
RUN apk add --no-cache python3

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install only production dependencies, skip postinstall scripts
RUN bun install --frozen-lockfile --production --ignore-scripts

# Copy pre-built node_modules from builder (includes compiled binaries)
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3/
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin/

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