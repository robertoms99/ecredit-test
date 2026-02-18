import { Context, Next } from 'hono';
import { verifyJWT } from '../../auth/jwt';
import { AppError } from '../../../domain/errors';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export async function jwtMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No autorizado - No se proporcionó token' }, 401);
  }

  // Remove 'Bearer ' prefix
  const token = authHeader.substring(7);

  try {
    const payload = await verifyJWT(token);

    c.set('auth', {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    } as AuthPayload);

    await next();
  } catch (error) {
    return c.json({ error: 'No autorizado - Token inválido' }, 401);
  }
}

export function getAuth(c: Context): AuthPayload {
  const auth = c.get('auth');
  if (!auth) {
    throw new AppError('INTERNAL_ERROR','Contexto de autenticación no disponible - ¿middleware no aplicado?');
  }
  return auth;
}
