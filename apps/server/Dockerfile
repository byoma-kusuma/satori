FROM oven/bun:1 AS base

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