
FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lockb* ./

RUN bun install --frozen-lockfile --production

FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY package.json bun.lockb* ./
COPY tsconfig.json ./
COPY src ./src

RUN bun run build

FROM oven/bun:1-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl netcat-openbsd

RUN addgroup -g 1001 -S bunuser && \
    adduser -S bunuser -u 1001

COPY --from=deps --chown=bunuser:bunuser /app/node_modules ./node_modules
COPY --from=builder --chown=bunuser:bunuser /app/dist ./dist
COPY --from=builder --chown=bunuser:bunuser /app/package.json ./
COPY --chown=bunuser:bunuser src/infrastructure/db ./src/infrastructure/db
COPY --chown=bunuser:bunuser docker-entrypoint.sh ./docker-entrypoint.sh

USER root
RUN chmod +x ./docker-entrypoint.sh
USER bunuser

ENV NODE_ENV=production
ENV PORT=3000

USER bunuser

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
