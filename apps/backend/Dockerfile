# Backend API - eCredit
# Multi-stage build for Bun + TypeScript

# Stage 1: Dependencies
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Stage 2: Builder
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY package.json bun.lockb* ./
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN bun run build

# Stage 3: Runner
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Install curl for healthcheck and netcat for DB wait
RUN apk add --no-cache curl netcat-openbsd

# Create non-root user
RUN addgroup -g 1001 -S bunuser && \
    adduser -S bunuser -u 1001

# Copy necessary files
COPY --from=deps --chown=bunuser:bunuser /app/node_modules ./node_modules
COPY --from=builder --chown=bunuser:bunuser /app/dist ./dist
COPY --from=builder --chown=bunuser:bunuser /app/package.json ./
COPY --chown=bunuser:bunuser src/infrastructure/db ./src/infrastructure/db
COPY --chown=bunuser:bunuser docker-entrypoint.sh ./docker-entrypoint.sh

# Make entrypoint executable
USER root
RUN chmod +x ./docker-entrypoint.sh
USER bunuser

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER bunuser

# Expose port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
ENTRYPOINT ["./docker-entrypoint.sh"]
