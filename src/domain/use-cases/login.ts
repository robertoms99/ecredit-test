import { UserRepository } from '../../infrastructure/adapters/repositories/user-repository';
import { verifyPassword, signJWT } from '../../infrastructure/auth/jwt';
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
  constructor(private userRepository: UserRepository) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    const { email, password } = request;

    // Find user by email
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AppError('AUTH_FAILED','Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('AUTH_FAILED','Invalid or expired token');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('AUTH_FAILED','Invalid credentials');
    }

    // Generate JWT token
    const token = await signJWT({
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
