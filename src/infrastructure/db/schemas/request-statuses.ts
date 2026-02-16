import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, numeric, boolean, doublePrecision, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { creditRequests } from './credit-requests';
import { statusTransitions } from './status-transition';

export const requestStatuses = pgTable('request_statuses', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 64 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isFinal: boolean('is_final').notNull().default(false),
  displayOrder: integer('display_order'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  codeUnique: uniqueIndex('request_statuses_code_unique').on(table.code),
}));

export const requestStatusesRelations = relations(requestStatuses, ({ many }) => ({
  creditRequests: many(creditRequests),
  fromTransitions: many(statusTransitions),
  toTransitions: many(statusTransitions),
}));
