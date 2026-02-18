export interface CreditRequest {
  id: string;
  country: string;
  fullName: string;
  documentId: string;
  requestedAmount: number;
  monthlyIncome: number;
  userId: string;
  statusId: string;
  status: {
    id: string;
    name: string;
    code?: string; // Optional for backward compatibility
  };
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListCreditRequestsResponse {
  data: CreditRequest[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreditRequestUpdateEvent {
  creditRequestId: string;
  statusId: string;
  statusCode: string; // e.g., "CREATED", "EVALUATING", "APPROVED", etc.
  statusName: string;
  updatedAt: string;
  reason: string | null;
  statusTransitionId: string;
  fromStatusId: string;
}

// Payload types for API requests
export interface CreateCreditRequestPayload {
  country: string;
  fullName: string;
  documentId: string;
  requestedAmount: number;
  monthlyIncome: number;
  // userId is now extracted from JWT token, not sent in request body
  userId?: string;
}

export interface UpdateStatusPayload {
  status: string;
  reason?: string;
}

// Status options for the UI
export interface StatusOption {
  code: string;
  name: string;
  color: string;
}

export interface RequestStatus {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isFinal: boolean;
  displayOrder: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface StatusTransition {
  id: string;
  reason: string | null;
  triggeredBy: 'user' | 'system' | 'webhook' | 'provider';
  metadata: Record<string, any>;
  creditRequestId: string;
  fromStatusId: string | null;
  toStatusId: string;
  createdAt: string;
  fromStatus: {
    id: string;
    name: string;
    code: string;
  } | null;
  toStatus: {
    id: string;
    name: string;
    code: string;
  };
}
