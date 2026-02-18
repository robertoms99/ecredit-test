import { IAuthTokenSigner, IPasswordHasher } from '../../../domain/ports/auth-token';
import { signJWT, verifyPassword, JWTPayload } from '../../auth/jwt';

export class JwtTokenSigner implements IAuthTokenSigner {
  async sign(payload: JWTPayload): Promise<string> {
    return signJWT(payload);
  }
}

export class BcryptPasswordHasher implements IPasswordHasher {
  async verify(password: string, hash: string): Promise<boolean> {
    return verifyPassword(password, hash);
  }
}
