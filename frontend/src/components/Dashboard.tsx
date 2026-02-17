import { useEffect, useState, useCallback } from 'react';
import { creditRequestsApi } from '../api/creditRequests';
import { CreditRequest, CreditRequestUpdateEvent, CreateCreditRequestPayload } from '../types';
import { useCreditRequestUpdates } from '../hooks/useSocket';
import { CreditRequestCard } from './CreditRequestCard';
import { CountryFilter } from './CountryFilter';
import { CreateCreditRequestForm } from './CreateCreditRequestForm';
import { CreditRequestDetailsModal } from './CreditRequestDetailsModal';
import { UpdateStatusModal } from './UpdateStatusModal';
import { StatusHistoryModal } from './StatusHistoryModal';
import { useAuth } from '../hooks/useAuth';



export function Dashboard() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [updatedIds, setUpdatedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CreditRequest | null>(null);

  // Loading states for actions
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await creditRequestsApi.list({
        country: selectedCountry || undefined,
        limit: 100,
      });
      setRequests(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las solicitudes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCountry]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleCreditRequestUpdate = useCallback(
    (event: CreditRequestUpdateEvent) => {
      console.log('📡 Real-time update received:', event);

      setRequests((prevRequests) => {
        // Check if request exists in current list
        const exists = prevRequests.some((req) => req.id === event.creditRequestId);

        if (exists) {
          // Update existing request
          return prevRequests.map((req) =>
            req.id === event.creditRequestId
              ? {
                  ...req,
                  statusId: event.statusId,
                  status: {
                    id: event.statusId,
                    name: event.statusName,
                    code: event.statusCode, // ✅ Now includes statusCode for proper mapping
                  },
                  updatedAt: event.updatedAt,
                }
              : req
          );
        } else {
          // New request was created, reload to get it
          loadRequests();
          return prevRequests;
        }
      });

      // Mark as updated for animation
      setUpdatedIds((prev) => new Set(prev).add(event.creditRequestId));

      setTimeout(() => {
        setUpdatedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(event.creditRequestId);
          return newSet;
        });
      }, 3000);
    },
    [loadRequests]
  );

  const { isConnected } = useCreditRequestUpdates(handleCreditRequestUpdate);

  // Handler: Create new credit request
  const handleCreateRequest = async (data: CreateCreditRequestPayload) => {
    try {
      setIsCreating(true);
      setError(null);
      // Remove userId from payload - it will be extracted from JWT token
      const { userId, ...payload } = data;
      const newRequest = await creditRequestsApi.create(payload);

      // Add new request to the list
      setRequests((prev) => [newRequest, ...prev]);
      setTotal((prev) => prev + 1);

      // Close form
      setShowCreateForm(false);

      // Show success feedback
      setUpdatedIds((prev) => new Set(prev).add(newRequest.id));
      setTimeout(() => {
        setUpdatedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(newRequest.id);
          return newSet;
        });
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la solicitud');
      throw err; // Re-throw so form can handle it
    } finally {
      setIsCreating(false);
    }
  };

  // Handler: View details
  const handleViewDetails = async (request: CreditRequest) => {
    try {
      // Fetch fresh data
      const freshRequest = await creditRequestsApi.getById(request.id);
      setSelectedRequest(freshRequest);
      setShowDetailsModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los detalles');
    }
  };

  // Handler: Update status
  const handleUpdateStatus = (request: CreditRequest) => {
    setSelectedRequest(request);
    setShowUpdateStatusModal(true);
  };

  // Handler: View history
  const handleViewHistory = (request: CreditRequest) => {
    setSelectedRequest(request);
    setShowHistoryModal(true);
  };

  const handleUpdateStatusSubmit = async (statusCode: string, reason?: string) => {
    if (!selectedRequest) return;

    try {
      setIsUpdatingStatus(true);
      setError(null);
      const updatedRequest = await creditRequestsApi.updateStatus(selectedRequest.id, { 
        status: statusCode,
        reason 
      });

      // Update request in list
      setRequests((prev) =>
        prev.map((req) => (req.id === updatedRequest.id ? updatedRequest : req))
      );

      // Close modal
      setShowUpdateStatusModal(false);
      setSelectedRequest(null);

      // Show success feedback
      setUpdatedIds((prev) => new Set(prev).add(updatedRequest.id));
      setTimeout(() => {
        setUpdatedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(updatedRequest.id);
          return newSet;
        });
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado');
      throw err; // Re-throw so modal can handle it
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header with User Info */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Gestión de Solicitudes de Crédito
              </h1>
              <p className="text-gray-600">
                {total} solicitudes creadas por ti
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* User Info */}
              {user && (
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase">Administrador</p>
                    <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                    title="Cerrar sesión"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Connection Indicator */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  } animate-pulse`}
                ></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>

              {/* Create Button */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Solicitud
              </button>
            </div>
          </div>

          {/* Filters */}
          <CountryFilter
            country={selectedCountry}
            onCountryChange={setSelectedCountry}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-700 hover:text-red-900"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && requests.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg mb-4">
              No se encontraron solicitudes
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Crear la primera solicitud
            </button>
          </div>
        )}

        {/* Requests Grid */}
        {!loading && requests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <CreditRequestCard
                key={request.id}
                request={request}
                isNew={updatedIds.has(request.id)}
                onViewDetails={handleViewDetails}
                onUpdateStatus={handleUpdateStatus}
                onViewHistory={handleViewHistory}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateForm && (
        <CreateCreditRequestForm
          onSubmit={handleCreateRequest}
          onCancel={() => setShowCreateForm(false)}
          isLoading={isCreating}
        />
      )}

      {showDetailsModal && selectedRequest && (
        <CreditRequestDetailsModal
          creditRequest={selectedRequest}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRequest(null);
          }}
        />
      )}

      {showUpdateStatusModal && selectedRequest && (
        <UpdateStatusModal
          creditRequest={selectedRequest}
          onUpdate={handleUpdateStatusSubmit}
          onCancel={() => {
            setShowUpdateStatusModal(false);
            setSelectedRequest(null);
          }}
          isLoading={isUpdatingStatus}
        />
      )}

      {/* Status History Modal */}
      {showHistoryModal && selectedRequest && (
        <StatusHistoryModal
          creditRequestId={selectedRequest.id}
          clientName={selectedRequest.fullName}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}
