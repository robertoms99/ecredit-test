import { requestStatuses } from "../../infrastructure/db/schemas";

export enum RequestStatusCodes {
  PENDING = 'PENDING',
  EVALUATING = 'EVALUATING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type RequestStatus = typeof requestStatuses.$inferSelect;
export type NewRequestStatus = typeof requestStatuses.$inferInsert;
