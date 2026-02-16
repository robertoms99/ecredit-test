import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import creditRequestRouter from "./controllers/credit-request";
import webhookRouter from "./controllers/webhook";
import { AppError, internalError } from "../../domain/errors";


const app = new Hono()
  .use('*', logger())
  .use('*', prettyJSON())
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
  .route("/credit-request", creditRequestRouter)
  .route("/webhook", webhookRouter)

export default app
