
console.error("s",process.env.REDIS_URL)
export const config = {
  db: {
    url: process.env.DATABASE_URL || "",
  },
  cache: {
    redisUrl: process.env.REDIS_URL || "",
    defaultTtlSeconds: Number(process.env.CACHE_TTL_SECONDS || 60),
  },
  server: {
    internalHost: process.env.INTERNAL_HOST || "",
    port: process.env.PORT || 3000,
  },
  cors: {
    frontendUrl: process.env.FRONTEND_URL || "",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  realtime: {
    wsPath: "/ws",
  },
  env: process.env.NODE_ENV || "development",
};
