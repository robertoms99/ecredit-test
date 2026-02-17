import { Context, Next } from 'hono';
import { verifyJWT } from '../../auth/jwt';
import { AppError } from '../../../domain/errors';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * JWT Authentication Middleware
 *
 * Extracts and verifies the JWT token from the Authorization header.
 * If valid, adds the decoded payload to the context as 'auth'.
 * If invalid or missing, returns a 401 Unauthorized response.
 *
 * Usage:
 * app.use('/api/protected/*', jwtMiddleware);
 */
export async function jwtMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const payload = await verifyJWT(token);

    // Add auth payload to context
    c.set('auth', {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    } as AuthPayload);

    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
}

/**
 * Helper to get auth payload from context
 */
export function getAuth(c: Context): AuthPayload {
  const auth = c.get('auth');
  if (!auth) {
    throw new AppError('INTERNAL_ERROR','Auth context not available - middleware not applied?');
  }
  return auth;
}
