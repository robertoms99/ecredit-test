import { Hono } from 'hono';
import { listRequestStatusesUseCase } from '../../di';
import { AppError } from '../../../domain/errors/app-error';

const router = new Hono();

router.get('/', async (c) => {
  try {
    const statuses = await listRequestStatusesUseCase.execute();
    return c.json(statuses);
  } catch (error) {
    if (error instanceof AppError) {
      return new Response(JSON.stringify(error.toResponse()), {
        status: error.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    throw error;
  }
});

export default router;
