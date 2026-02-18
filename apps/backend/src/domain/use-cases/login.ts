import type { IUserRepository } from '../ports/repositories/user-repository';
import type { IAuthTokenSigner, IPasswordHasher } from '../ports/auth-token';
import { AppError } from '../errors';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenSigner: IAuthTokenSigner,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    const { email, password } = request;

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AppError('AUTH_FAILED','Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new AppError('AUTH_FAILED','Token inválido o expirado');
    }

    const isPasswordValid = await this.passwordHasher.verify(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('AUTH_FAILED','Credenciales inválidas');
    }

    const token = await this.tokenSigner.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
