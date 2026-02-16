import { creditRequests } from "../../infrastructure/db/schemas";

export type CreditRequest = typeof creditRequests.$inferSelect;
export type NewCreditRequest = typeof creditRequests.$inferInsert;
