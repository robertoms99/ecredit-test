import { Hono } from "hono";
import { validator } from 'hono/validator'
import {
  createCreditRequestUseCase,
  getCreditRequestUseCase,
  listCreditRequestsUseCase,
  updateCreditRequestStatusUseCase,
  getStatusHistoryUseCase
} from "../../di";
import {
  createCreditRequestSchema,
  getCreditRequestParamsSchema,
  listCreditRequestsQuerySchema,
  updateCreditRequestStatusParamsSchema,
  updateCreditRequestStatusBodySchema
} from "../schemas";
import { AppError, validationError } from '../../../domain/errors';
import { jwtMiddleware, getAuth } from '../middleware/auth';

const router = new Hono()

router.use('/*', jwtMiddleware);

router.post("/",
  validator('json', (value, c) => {
    const parsed = createCreditRequestSchema.safeParse(value)
    if (!parsed.success) {
      const details = parsed.error.flatten();
      throw validationError('Cuerpo de solicitud inválido', details);
    }
    return parsed.data
  }),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const auth = getAuth(c);

      const saved = await createCreditRequestUseCase.execute({
        ...body,
        userId: auth.userId,
      });

      return c.json(saved, 201);
    } catch (error) {
      if (error instanceof AppError) {
        return new Response(JSON.stringify(error.toResponse()), {
          status: error.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }
  }
);

router.get('/:id',
  validator('param', (value, c) => {
    const parsed = getCreditRequestParamsSchema.safeParse(value);
    if (!parsed.success) {
      const details = parsed.error.flatten();
      throw validationError('Invalid credit request ID', details);
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const auth = getAuth(c);

      const req = await getCreditRequestUseCase.execute(id);

      if (!req) {
        return c.json({ error: 'Solicitud de crédito no encontrada' }, 404);
      }

      if (req.userId !== auth.userId) {
        return c.json({
          error: 'Prohibido - Solo puedes ver solicitudes de crédito que creaste'
        }, 403);
      }

      return c.json(req);
    } catch (error) {
      if (error instanceof AppError) {
        return new Response(JSON.stringify(error.toResponse()), {
          status: error.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }
  }
);

router.get('/',
  validator('query', (value, c) => {
    const parsed = listCreditRequestsQuerySchema.safeParse(value);
    if (!parsed.success) {
      const details = parsed.error.flatten();
      throw validationError('Parámetros de consulta inválidos', details);
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const filters = c.req.valid('query');
      const auth = getAuth(c);

      const result = await listCreditRequestsUseCase.execute({
        ...filters,
        userId: auth.userId,
      });

      return c.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return new Response(JSON.stringify(error.toResponse()), {
          status: error.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }
  }
);

router.patch('/:id/status',
  validator('param', (value, c) => {
    const parsed = updateCreditRequestStatusParamsSchema.safeParse(value);
    if (!parsed.success) {
      const details = parsed.error.flatten();
      throw validationError('ID de solicitud de crédito inválido', details);
    }
    return parsed.data;
  }),
  validator('json', (value, c) => {
    const parsed = updateCreditRequestStatusBodySchema.safeParse(value);
    if (!parsed.success) {
      const details = parsed.error.flatten();
      throw validationError('Cuerpo de solicitud inválido', details);
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const { status, reason } = c.req.valid('json');
      const auth = getAuth(c);

      const existingRequest = await getCreditRequestUseCase.execute(id);

      if (!existingRequest) {
        return c.json({ error: 'Solicitud de crédito no encontrada' }, 404);
      }

      if (existingRequest.userId !== auth.userId) {
        return c.json({
          error: 'Prohibido - Solo puedes actualizar solicitudes de crédito que creaste'
        }, 403);
      }

      const updated = await updateCreditRequestStatusUseCase.execute({
        creditRequestId: id,
        statusCode: status,
        reason,
        triggeredBy: 'user',
        userId: auth.userId,
      });

      return c.json(updated);
    } catch (error) {
      if (error instanceof AppError) {
        return new Response(JSON.stringify(error.toResponse()), {
          status: error.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }
  }
);

router.get('/:id/history',
  validator('param', (value, c) => {
    const parsed = getCreditRequestParamsSchema.safeParse(value);
    if (!parsed.success) {
      const details = parsed.error.flatten();
      throw validationError('Invalid credit request ID', details);
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const auth = getAuth(c);

      const history = await getStatusHistoryUseCase.execute(id, auth.userId);

      return c.json(history);
    } catch (error) {
      if (error instanceof AppError) {
        return new Response(JSON.stringify(error.toResponse()), {
          status: error.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }
  }
);

export default router;
