import { requestStatuses } from "../../infrastructure/db/schemas";

export enum RequestStatusCodes {
  CREATED = 'CREATED',
  PENDING_FOR_BANK_DATA = 'PENDING_FOR_BANK_DATA',
  EVALUATING = 'EVALUATING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type RequestStatus = typeof requestStatuses.$inferSelect;
export type NewRequestStatus = typeof requestStatuses.$inferInsert;
