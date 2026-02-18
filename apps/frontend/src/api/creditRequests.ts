import { ListCreditRequestsResponse, CreditRequest, CreateCreditRequestPayload, UpdateStatusPayload, StatusTransition, RequestStatus } from '../types';

// Use environment variable for API URL, fallback to relative URL for production
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api` || '/api';

/**
 * Get the JWT token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Create headers with Authorization token
 */
function getHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

export const creditRequestsApi = {
  /**
   * List all credit requests with optional filters
   */
  async list(filters?: {
    country?: string;
    status?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }): Promise<ListCreditRequestsResponse> {
    const params = new URLSearchParams();

    if (filters?.country) params.append('country', filters.country);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await fetch(`${API_BASE_URL}/credit-requests?${params}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch credit requests' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Get a single credit request by ID
   */
  async getById(id: string): Promise<CreditRequest> {
    const response = await fetch(`${API_BASE_URL}/credit-requests/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch credit request' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Create a new credit request
   */
  async create(data: CreateCreditRequestPayload): Promise<CreditRequest> {
    const response = await fetch(`${API_BASE_URL}/credit-requests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create credit request' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Update credit request status
   */
  async updateStatus(id: string, data: UpdateStatusPayload): Promise<CreditRequest> {
    const response = await fetch(`${API_BASE_URL}/credit-requests/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update status' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Get status transition history for a credit request
   */
  async getHistory(id: string): Promise<StatusTransition[]> {
    const response = await fetch(`${API_BASE_URL}/credit-requests/${id}/history`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch history' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Get all available request statuses
   */
  async getStatuses(): Promise<RequestStatus[]> {
    const response = await fetch(`${API_BASE_URL}/request-statuses`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al obtener estados' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};
