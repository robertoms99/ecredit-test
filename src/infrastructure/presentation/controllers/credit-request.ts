import { Hono } from "hono";
import { validator } from 'hono/validator'
import { createCreditRequestUseCase, getCreditRequestUseCase, listCreditRequestsUseCase, updateCreditRequestStatusUseCase } from "../../di";
import * as z from 'zod'
import { createCreditRequestSchema } from "../schemas/create-credit-request";
import { AppError, validationError, notFoundError } from '../../../domain/errors';

const router = new Hono()

router.post("/",
  validator('json', (value, c) => {
    const parsed = createCreditRequestSchema.safeParse(value)
    if (!parsed.success) {
      const details = parsed.error.flatten();
      throw validationError('Schema enviado es invalido', details);
    }
    return parsed.data
  })
  , async (c) => {
  try {
    const body = await c.req.json();
    try {
      const saved = await createCreditRequestUseCase.execute(body);
      return c.json(saved, 201);
    } catch (e: any) {
      if (e instanceof AppError) {
        return new Response(JSON.stringify(e.toResponse()), { status: e.status, headers: { 'Content-Type': 'application/json' } });
      }
      throw e;
    }
  } catch (error) {
    console.error(error);
    if (error instanceof AppError) {
      return new Response(JSON.stringify(error.toResponse()), { status: error.status, headers: { 'Content-Type': 'application/json' } });
    }
    throw error;
  }
});


router.get('/:id', async (c) => {
  const id = c.req.param('id');
  const req = await getCreditRequestUseCase.execute(id as any);
  if (!req) throw notFoundError('Credit request not found');
  return c.json(req);
});

router.get('/', async (c) => {
  const country = c.req.query('country');
  const status = c.req.query('status') as any;
  const from = c.req.query('from');
  const to = c.req.query('to');
  const list = await listCreditRequestsUseCase.execute({ country: country as any, status, from, to } as any);
  return c.json(list);
});

router.put('/:id/status', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();
  try {
    const updated = await updateCreditRequestStatusUseCase.execute(id as any);
    if (!updated) throw notFoundError('Credit request not found');
    return c.json(updated);
  } catch (e: any) {
    if (e instanceof AppError) {
      return new Response(JSON.stringify(e.toResponse()), { status: e.status, headers: { 'Content-Type': 'application/json' } });
    }
    throw e;
  }
});

export default router;
