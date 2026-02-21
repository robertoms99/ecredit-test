import { useEffect, useState, useCallback, useRef } from 'react';
import { creditRequestsApi } from '../api/creditRequests';
import { CreditRequest, CreditRequestUpdateEvent, CreateCreditRequestPayload, RequestStatus } from '../types';
import { useCreditRequestUpdates } from '../hooks/useSocket';
import { useDebounce } from '../hooks/useDebounce';
import { CreditRequestCard } from './CreditRequestCard';
import { CountryFilter } from './CountryFilter';
import { AdvancedFilters } from './AdvancedFilters';
import { CreateCreditRequestForm } from './CreateCreditRequestForm';
import { CreditRequestDetailsModal } from './CreditRequestDetailsModal';
import { UpdateStatusModal } from './UpdateStatusModal';
import { StatusHistoryModal, StatusHistoryModalRef } from './StatusHistoryModal';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../contexts/NotificationContext';



export function Dashboard() {
  const { user, logout } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');
  const [searchDocumentId, setSearchDocumentId] = useState<string>('');
  const debouncedSearchId = useDebounce(searchId, 400);
  const debouncedSearchDocumentId = useDebounce(searchDocumentId, 400);
  const [statuses, setStatuses] = useState<RequestStatus[]>([]);
  const [total, setTotal] = useState(0);
  const [updatedIds, setUpdatedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CreditRequest | null>(null);

  // Ref for StatusHistoryModal to refresh it when receiving real-time updates
  const historyModalRef = useRef<StatusHistoryModalRef>(null);

  // Loading states for actions
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      
      // If searching by ID, use getById endpoint
      if (debouncedSearchId.trim()) {
        try {
          const request = await creditRequestsApi.getById(debouncedSearchId.trim());
          setRequests([request]);
          setTotal(1);
        } catch (err) {
          // If not found or error, show empty state
          setRequests([]);
          setTotal(0);
          if (err instanceof Error && !err.message.includes('404')) {
            showError(err.message);
          }
        }
        return;
      }

      // Otherwise use list endpoint with filters
      const response = await creditRequestsApi.list({
        country: selectedCountry || undefined,
        status: selectedStatus || undefined,
        documentId: debouncedSearchDocumentId || undefined,
        from: dateFrom ? new Date(dateFrom + 'T00:00:00').toISOString() : undefined,
        to: dateTo ? new Date(dateTo + 'T23:59:59.999').toISOString() : undefined,
        limit: 100,
      });
      setRequests(response.data);
      setTotal(response.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar las solicitudes';
      showError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCountry, selectedStatus, dateFrom, dateTo, debouncedSearchId, debouncedSearchDocumentId, showError]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Load statuses on mount
  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const fetchedStatuses = await creditRequestsApi.getStatuses();
        setStatuses(fetchedStatuses);
      } catch (err) {
        console.error('Error loading statuses:', err);
        // Don't show error notification for this, just log it
      }
    };
    loadStatuses();
  }, []);

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
                    code: event.statusCode,
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

      // If history modal is open and the update is for the selected request, refresh it
      if (showHistoryModal && selectedRequest?.id === event.creditRequestId) {
        historyModalRef.current?.refresh();
      }

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
    [loadRequests, showHistoryModal, selectedRequest]
  );

  const { isConnected } = useCreditRequestUpdates(handleCreditRequestUpdate);

  // Handler: Create new credit request
  const handleCreateRequest = async (data: CreateCreditRequestPayload) => {
    try {
      setIsCreating(true);
      // Remove userId from payload - it will be extracted from JWT token
      const { userId, ...payload } = data;
      const newRequest = await creditRequestsApi.create(payload);

      // Clear all filters to ensure new request is visible
      setSelectedCountry('');
      setSelectedStatus('');
      setDateFrom('');
      setDateTo('');
      setSearchId('');
      setSearchDocumentId('');

      // Add new request to the list
      setRequests((prev) => [newRequest, ...prev]);
      setTotal((prev) => prev + 1);

      // Close form
      setShowCreateForm(false);

      // Show success notification
      showSuccess('Solicitud creada exitosamente');

      // Show visual feedback
      setUpdatedIds((prev) => new Set(prev).add(newRequest.id));
      setTimeout(() => {
        setUpdatedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(newRequest.id);
          return newSet;
        });
      }, 3000);
    } catch (err) {
      throw err; // Re-throw so form can show error in modal
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
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los detalles';
      showError(errorMessage);
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

      // Show success notification
      showSuccess('Estado actualizado exitosamente');

      // Show visual feedback
      setUpdatedIds((prev) => new Set(prev).add(updatedRequest.id));
      setTimeout(() => {
        setUpdatedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(updatedRequest.id);
          return newSet;
        });
      }, 3000);
    } catch (err) {
      throw err; // Re-throw so modal can show error
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
          <div className="space-y-4">
            <CountryFilter
              country={selectedCountry}
              onCountryChange={setSelectedCountry}
            />
            <AdvancedFilters
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              statuses={statuses}
              searchId={searchId}
              onSearchIdChange={setSearchId}
              searchDocumentId={searchDocumentId}
              onSearchDocumentIdChange={setSearchDocumentId}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && requests.length === 0 && (
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
          ref={historyModalRef}
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
