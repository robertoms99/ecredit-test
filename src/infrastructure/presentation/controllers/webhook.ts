import { Hono } from "hono";
import { validator } from 'hono/validator'
import { createCreditRequestUseCase, getCreditRequestUseCase, listCreditRequestsUseCase, processExternalBankDataUseCase, updateCreditRequestStatusUseCase } from "../../di";
import { createCreditRequestSchema } from "../schemas/create-credit-request";
import { AppError, validationError, notFoundError } from '../../../domain/errors';
import { processBankDataSchema } from "../schemas/process-external-bank-data";

const router = new Hono()

router.post("/process-bank-data",
  validator('json', (value, c) => {
    const parsed = processBankDataSchema.safeParse(value)
    if (!parsed.success) {
      const details = parsed.error.flatten();
      throw validationError('Data enviada es invalida', details);
    }
    return parsed.data
  })
  , async (c) => {
  try {
    const body = await c.req.json();
    try {
      const saved = await processExternalBankDataUseCase.execute(body);
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


export default router;
