import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, numeric, boolean, doublePrecision, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { creditRequests } from './credit-requests';

export const bankingInfo = pgTable('banking_info', {
  id: uuid('id').defaultRandom().primaryKey(),
  externalRequestId: uuid('external_request_id').notNull(),
  providerName: varchar('provider_name', { length: 255 }).notNull(),
  providerResponseAt: timestamp('provider_response_at', { withTimezone: true }),
  financialData: jsonb('financial_data').notNull().default({}),
  fetchStatus: varchar('fetch_status', { length: 64 }).notNull().default('pending'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').notNull().default(0),
  creditRequestId: uuid('credit_request_id').notNull().references(() => creditRequests.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bankingInfoRelations = relations(bankingInfo, ({ one }) => ({
  creditRequest: one(creditRequests, {
    fields: [bankingInfo.creditRequestId],
    references: [creditRequests.id],
  }),
}));
