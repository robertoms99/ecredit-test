import { statusTransitions } from '../../infrastructure/db/schemas';

export type StatusTransition = typeof statusTransitions.$inferSelect;
export type NewStatusTransition = typeof statusTransitions.$inferInsert;
