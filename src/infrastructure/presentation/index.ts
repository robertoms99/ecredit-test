import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";
import creditRequestRouter from "./controllers/credit-request";
import webhookRouter from "./controllers/webhook";
import authController from "./controllers/auth";
import { AppError, internalError } from "../../domain/errors";
import { config } from "../../config";


const app = new Hono()
  .use('*', logger())
  .use('*', prettyJSON())
  .use('*', cors({
    origin: [config.cors.frontendUrl, 'http://localhost:3000'],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }))
  .onError(async (err, c) => {
    const appErr = err instanceof AppError ? err : internalError();
    const body = appErr.toResponse();
    return new Response(JSON.stringify(body), {
      status: appErr.status,
      headers: { 'Content-Type': 'application/json' },
    });
  })

app.get('/health', (c) => c.json({ status: 'ok' }));

app.basePath("/api")
  .route("/auth", authController)
  .route("/credit-requests", creditRequestRouter)
  .route("/webhook", webhookRouter)

console.log(`🔐 CORS configured for frontend: ${config.cors.frontendUrl}`);

export default app
