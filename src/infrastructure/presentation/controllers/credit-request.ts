import { Hono } from "hono";
import { validator } from 'hono/validator'
import { createCreditRequestUseCase, getCreditRequestUseCase, listCreditRequestsUseCase, updateCreditRequestStatusUseCase } from "../../di";
import { 
  createCreditRequestSchema,
  getCreditRequestParamsSchema,
  listCreditRequestsQuerySchema,
  updateCreditRequestStatusParamsSchema,
  updateCreditRequestStatusBodySchema
} from "../schemas";
import { AppError, validationError } from '../../../domain/errors';

const router = new Hono()

router.post("/",
  validator('json', (value, c) => {
    const parsed = createCreditRequestSchema.safeParse(value)
    if (!parsed.success) {
      const details = parsed.error.flatten();
      throw validationError('Invalid request body', details);
    }
    return parsed.data
  }),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const saved = await createCreditRequestUseCase.execute(body);
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
      const req = await getCreditRequestUseCase.execute(id);
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
      throw validationError('Invalid query parameters', details);
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const filters = c.req.valid('query');
      const result = await listCreditRequestsUseCase.execute(filters);
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

router.put('/:id/status',
  validator('param', (value, c) => {
    const parsed = updateCreditRequestStatusParamsSchema.safeParse(value);
    if (!parsed.success) {
      const details = parsed.error.flatten();
      throw validationError('Invalid credit request ID', details);
    }
    return parsed.data;
  }),
  validator('json', (value, c) => {
    const parsed = updateCreditRequestStatusBodySchema.safeParse(value);
    if (!parsed.success) {
      const details = parsed.error.flatten();
      throw validationError('Invalid request body', details);
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const { status } = c.req.valid('json');
      
      const updated = await updateCreditRequestStatusUseCase.execute({
        creditRequestId: id,
        statusCode: status
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

export default router;
