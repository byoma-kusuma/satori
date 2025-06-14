FROM oven/bun:1 AS base

# Install Python and build tools for native dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install

# Copy source files
COPY . .

# Run migrations (skip if no database connection)
RUN bun run auth:migrate || echo "Migration skipped - no database connection"

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]