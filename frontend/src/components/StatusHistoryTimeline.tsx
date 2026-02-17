import { StatusTransition } from '../types';
import { getStatusName, getStatusColor } from '../constants/statusConfig';

interface StatusHistoryTimelineProps {
  history: StatusTransition[];
  isLoading?: boolean;
}

export function StatusHistoryTimeline({ history, isLoading }: StatusHistoryTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay historial de cambios disponible</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTriggeredByLabel = (triggeredBy: string) => {
    const labels: Record<string, string> = {
      user: 'Usuario',
      system: 'Sistema',
      webhook: 'Webhook',
      provider: 'Proveedor',
    };
    return labels[triggeredBy] || triggeredBy;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Historial de Cambios de Estado
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Timeline items */}
        <div className="space-y-6">
          {history.map((transition, index) => {
            const fromStatusName = transition.fromStatus 
              ? getStatusName(transition.fromStatus.code)
              : 'Inicial';
            const toStatusName = getStatusName(transition.toStatus.code);
            const toStatusColor = getStatusColor(transition.toStatus.code);
            const isFirst = index === 0;

            return (
              <div key={transition.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center ${
                  isFirst ? 'bg-blue-600' : 'bg-gray-400'
                } ring-4 ring-white`}>
                  {isFirst ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  )}
                </div>

                {/* Transition card */}
                <div className={`bg-white rounded-lg shadow-sm border ${
                  isFirst ? 'border-blue-200' : 'border-gray-200'
                } p-4`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {transition.fromStatus && (
                          <>
                            <span className="text-sm text-gray-600">
                              {fromStatusName}
                            </span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </>
                        )}
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${toStatusColor}`}>
                          {toStatusName}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(transition.createdAt)}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {getTriggeredByLabel(transition.triggeredBy)}
                    </span>
                  </div>

                  {/* Reason */}
                  {transition.reason && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-700 mb-1">Razón:</p>
                      <p className="text-sm text-gray-600">{transition.reason}</p>
                    </div>
                  )}

                  {/* Metadata info (if user info is available) */}
                  {transition.metadata?.userId && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Modificado por: Admin ID {transition.metadata.userId.substring(0, 8)}...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Total de cambios: <span className="font-semibold text-gray-900">{history.length}</span>
        </p>
      </div>
    </div>
  );
}
