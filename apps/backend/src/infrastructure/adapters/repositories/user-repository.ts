import { eq } from 'drizzle-orm';
import { db, schema } from '../../db/client';
import type { IUserRepository } from '../../../domain/ports/repositories/user-repository';
import type { User } from '../../../domain/entities/user';

export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    return users.length > 0 ? users[0] : null;
  }

  async findById(id: string): Promise<User | null> {
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    return users.length > 0 ? users[0] : null;
  }
}
