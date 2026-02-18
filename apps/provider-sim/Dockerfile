
FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lockb* ./

RUN bun install --frozen-lockfile --production

FROM oven/bun:1-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl

RUN addgroup -g 1001 -S bunuser && \
    adduser -S bunuser -u 1001

COPY --from=deps --chown=bunuser:bunuser /app/node_modules ./node_modules
COPY --chown=bunuser:bunuser package.json ./
COPY --chown=bunuser:bunuser src ./src

ENV NODE_ENV=production
ENV PROVIDER_PORT=3001

USER bunuser

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["bun", "src/server.ts"]
