import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, numeric, boolean, doublePrecision, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { creditRequests } from './credit-requests';
import { requestStatuses } from './request-statuses';

export const statusTransitions = pgTable('status_transitions', {
  id: uuid('id').defaultRandom().primaryKey(),
  reason: text('reason'),
  triggeredBy: varchar('triggered_by', { length: 32 }).notNull(), // 'user' | 'system' | 'webhook' | 'provider'
  metadata: jsonb('metadata').$type<Record<string, any>>().notNull().default({}),
  creditRequestId: uuid('credit_request_id').notNull().references(() => creditRequests.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  fromStatusId: uuid('from_status_id').references(() => requestStatuses.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  toStatusId: uuid('to_status_id').notNull().references(() => requestStatuses.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const statusTransitionsRelations = relations(statusTransitions, ({ one }) => ({
  creditRequest: one(creditRequests, {
    fields: [statusTransitions.creditRequestId],
    references: [creditRequests.id],
  }),
  fromStatus: one(requestStatuses, {
    fields: [statusTransitions.fromStatusId],
    references: [requestStatuses.id],
  }),
  toStatus: one(requestStatuses, {
    fields: [statusTransitions.toStatusId],
    references: [requestStatuses.id],
  }),
}));
