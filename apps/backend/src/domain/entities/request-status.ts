import { requestStatuses } from "../../infrastructure/db/schemas";

export enum RequestStatusCodes {
  CREATED = 'CREATED',
  PENDING_FOR_BANK_DATA = 'PENDING_FOR_BANK_DATA',
  EVALUATING = 'EVALUATING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FAILED_FROM_PROVIDER = 'FAILED_FROM_PROVIDER',
}

export type RequestStatus = typeof requestStatuses.$inferSelect;
export type NewRequestStatus = typeof requestStatuses.$inferInsert;
