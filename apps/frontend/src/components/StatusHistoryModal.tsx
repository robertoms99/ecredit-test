import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { StatusTransition } from '../types';
import { StatusHistoryTimeline } from './StatusHistoryTimeline';
import { creditRequestsApi } from '../api/creditRequests';

interface StatusHistoryModalProps {
  creditRequestId: string;
  clientName: string;
  onClose: () => void;
}

export interface StatusHistoryModalRef {
  refresh: () => void;
}

export const StatusHistoryModal = forwardRef<StatusHistoryModalRef, StatusHistoryModalProps>(
  ({ creditRequestId, clientName, onClose }, ref) => {
    const [history, setHistory] = useState<StatusTransition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await creditRequestsApi.getHistory(creditRequestId);
        setHistory(data);
      } catch (err) {
        console.error('Error fetching history:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el historial');
      } finally {
        setIsLoading(false);
      }
    }, [creditRequestId]);

    useEffect(() => {
      fetchHistory();
    }, [fetchHistory]);

    // Expose refresh method to parent component
    useImperativeHandle(ref, () => ({
      refresh: fetchHistory
    }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Historial de Estados
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Cliente: <span className="font-medium text-gray-900">{clientName}</span>
              </p>
              <p className="text-xs text-gray-500 font-mono mt-1">
                ID: {creditRequestId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600 font-medium mb-2">Error al cargar el historial</p>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            </div>
          ) : (
            <StatusHistoryTimeline history={history} isLoading={isLoading} />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
});
