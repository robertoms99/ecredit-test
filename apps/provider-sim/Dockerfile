# Provider Simulator - eCredit
# Simulates external banking provider APIs

# Stage 1: Dependencies
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Stage 2: Runner
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S bunuser && \
    adduser -S bunuser -u 1001

# Copy dependencies and source
COPY --from=deps --chown=bunuser:bunuser /app/node_modules ./node_modules
COPY --chown=bunuser:bunuser package.json ./
COPY --chown=bunuser:bunuser src ./src

# Set environment
ENV NODE_ENV=production
ENV PROVIDER_PORT=3001

# Switch to non-root user
USER bunuser

# Expose port
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["bun", "src/server.ts"]
