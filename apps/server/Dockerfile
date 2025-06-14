FROM oven/bun:1.0 as base

WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Build the application
RUN bun run auth:migrate

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]