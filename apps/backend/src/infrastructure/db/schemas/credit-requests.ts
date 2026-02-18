import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, numeric, boolean, doublePrecision, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { requestStatuses } from './request-statuses';
import { bankingInfo } from './banking-info';
import { statusTransitions } from './status-transition';

export const creditRequests = pgTable('credit_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  country: varchar('country', { length: 2 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  documentId: varchar('document_id', { length: 64 }).notNull(),
  requestedAmount: doublePrecision('requested_amount').notNull(),
  monthlyIncome: doublePrecision('monthly_income').notNull(),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  statusId: uuid('status_id').notNull().references(() => requestStatuses.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  countryIdx: index('credit_requests_country_idx').on(table.country),
  statusIdx: index('credit_requests_status_idx').on(table.statusId),
  requestedAtIdx: index('credit_requests_requested_at_idx').on(table.requestedAt),
}));

export const creditRequestsRelations = relations(creditRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [creditRequests.userId],
    references: [users.id],
  }),
  status: one(requestStatuses, {
    fields: [creditRequests.statusId],
    references: [requestStatuses.id],
  }),
  bankingInfo: one(bankingInfo, {
    fields: [creditRequests.id],
    references: [bankingInfo.creditRequestId],
  }),
  statusTransitions: many(statusTransitions),
}));
