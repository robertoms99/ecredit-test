import { users } from '../../infrastructure/db/schemas';

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
