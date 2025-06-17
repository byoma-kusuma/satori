FROM oven/bun:alpine

# Install dependencies for building native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package.json ./
COPY bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Define build arguments with defaults
ARG NODE_ENV=production
ARG PORT=3000

# Set environment variables
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}

# Expose port
EXPOSE ${PORT}

# Start application
CMD ["bun", "run", "start"]