export const config = {
  db: {
    url: process.env.DATABASE_URL || "",
  },
  server: {
    internalHost: process.env.INTERNAL_HOST || "",
    port: process.env.PORT || 3000,
  },
  cors: {
    frontendUrl: process.env.FRONTEND_URL || "",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "change-me-in-production-very-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  realtime: {
    wsPath: "/ws",
  },
  env: process.env.NODE_ENV || "development",
};
