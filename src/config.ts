export const config = {
  db: {
    url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/ecredit",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
  server: {
    port: process.env.PORT || 3000,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
    issuer: "ecredit",
    audience: "ecredit-clients",
  },
  realtime: {
    wsPath: "/ws",
  },
};
