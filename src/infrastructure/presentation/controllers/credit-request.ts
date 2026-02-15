import { Hono } from "hono";
import { validator } from 'hono/validator'
import { createCreditRequestUseCase, getCreditRequestUseCase, listCreditRequestsUseCase, updateCreditRequestStatusUseCase } from "../../di";
import * as z from 'zod'
import { createCreditRequestSchema } from "../schemas/create-credit-request";

const router = new Hono()

router.post("/",
  validator('json', (value, c) => {
    const parsed = createCreditRequestSchema.safeParse(value)
    if (!parsed.success) {
      return c.json(parsed.error, 400);
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
      return c.json({ error: e.message }, 400);
    }
  } catch (error) {
    console.error(error);
    return c.json({ error: "Body invalido" }, 400);
  }
});


router.get('/:id', async (c) => {
  const id = c.req.param('id');
  const req = await getCreditRequestUseCase.execute(id as any);
  if (!req) return c.json({ error: 'Not found' }, 404);
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
    if (!updated) return c.json({ error: 'Not found' }, 404);
    return c.json(updated);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

export default router;
