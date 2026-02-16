import { bankingInfo } from '../../infrastructure/db/schemas';

export type BankingInfo = typeof bankingInfo.$inferSelect;

export type NewBankingInfo = typeof bankingInfo.$inferInsert;
