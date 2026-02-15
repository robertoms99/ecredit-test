import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import creditRequestRouter from "./controllers/credit-request";


const app = new Hono();
app.use('*', logger());
app.use('*', prettyJSON());

/*
// Simple auth middleware
app.use('/api/*', async (c, next) => {
  const auth = c.req.header('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const token = auth.substring(7);
    // Dev bypass: allow token 'dev' in non-production
    const isDevBypass = token === 'dev' && process.env.NODE_ENV !== 'production';
    const payload = isDevBypass ? { sub: 'dev-user', role: 'admin' } : await verifyJwt(token);
    c.set('user', payload);
    await next();
  } catch (e) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}); // WebSocket upgrade route
app.get(config.realtime.wsPath, (c) => {
  const ok = c.env?.upgrade?.(c.req);
  if (!ok) return c.text('Upgrade required', 426);
});
 */



app.get('/health', (c) => c.json({ status: 'ok' }));

app.basePath("/api")
  .route("/credit-request", creditRequestRouter)

export default app
