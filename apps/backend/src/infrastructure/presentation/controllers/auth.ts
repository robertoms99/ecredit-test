import { Context, Hono } from 'hono';
import { LoginUseCase } from '../../../domain/use-cases/login';
import { UserRepository } from '../../adapters/repositories/user-repository';
import { jwtMiddleware, getAuth } from '../middleware/auth';

const authController = new Hono();

const userRepository = new UserRepository();
const loginUseCase = new LoginUseCase(userRepository);


authController.post('/login', async (c: Context) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email y contraseña son requeridos' }, 400);
    }

    const result = await loginUseCase.execute({ email, password });

    return c.json(result, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login fallido';

    if (message.includes('Credenciales inválidas') || message.includes('no activo') || message.includes('Token inválido')) {
      return c.json({ error: message }, 401);
    }

    console.error('Login error:', error);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});


authController.get('/me', jwtMiddleware, async (c: Context) => {
  try {
    const auth = getAuth(c);

    const user = await userRepository.findById(auth.userId);

    if (!user) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    }, 200);
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

export default authController;
