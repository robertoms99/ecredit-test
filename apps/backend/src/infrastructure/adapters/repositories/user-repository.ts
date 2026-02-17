import { eq } from 'drizzle-orm';
import { db, schema } from '../../db/client';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepository {
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
