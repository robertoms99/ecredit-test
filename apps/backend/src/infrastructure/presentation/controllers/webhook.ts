import { Hono } from "hono";
import { validator } from 'hono/validator'
import { processExternalBankDataUseCase } from "../../di";
import { AppError, validationError } from '../../../domain/errors';
import { processBankDataSchema } from "../schemas/process-external-bank-data";

const router = new Hono()

router.post("/process-bank-data",
  validator('json', (value, c) => {
    const parsed = processBankDataSchema.safeParse(value)
    if (!parsed.success) {
      const details = parsed.error.flatten();
      throw validationError('Falta correlation_id o es inválido', details);
    }
    return parsed.data
  })
  , async (c) => {
  try {
    const body = await c.req.json();

    await processExternalBankDataUseCase.execute({
      externalRequestId: body.correlation_id,
      payload: body,
    });

    return c.json({ success: true, message: 'Datos bancarios recibidos y procesándose' }, 200);
  } catch (error) {
    console.error('[Webhook] Error processing bank data:', error);
    if (error instanceof AppError) {
      return new Response(JSON.stringify(error.toResponse()), { status: error.status, headers: { 'Content-Type': 'application/json' } });
    }
    throw error;
  }
});


export default router;
