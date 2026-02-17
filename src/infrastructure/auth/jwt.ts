import { SignJWT, jwtVerify } from 'jose';
import { config } from '../../config';
import { AppError } from '../../domain/errors';

const secret = new TextEncoder().encode(config.jwt.secret);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Sign a JWT token with user data
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.jwt.expiresIn)
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch (error) {
    throw new AppError('AUTH_FAILED','Invalid or expired token');
  }
}

/**
 * Hash a password using Bun's built-in hasher
 */
export async function hashPassword(password: string): Promise<string> {
  // Bun provides Bun.password API for hashing with bcrypt
  return await Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 10, // rounds
  });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await Bun.password.verify(password, hash, 'bcrypt');
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
