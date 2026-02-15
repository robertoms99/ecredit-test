import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import Redis from 'ioredis';
import app from './infrastructure/presentation';
import { config } from './config';

const server = Bun.serve({
  port: config.server.port,
  fetch: (req) => app.fetch(req)
});

console.log(`Server running on :${server.port}`);
