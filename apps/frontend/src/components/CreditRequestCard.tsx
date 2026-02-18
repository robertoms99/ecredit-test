import { CreditRequest } from '../types';
import { getStatusName, getStatusColor } from '../constants/statusConfig';
import { useCountries } from '../contexts/CountriesContext';

interface Props {
  request: CreditRequest;
  isNew?: boolean;
  onViewDetails: (request: CreditRequest) => void;
  onUpdateStatus: (request: CreditRequest) => void;
  onViewHistory: (request: CreditRequest) => void;
}

export function CreditRequestCard({ request, isNew, onViewDetails, onUpdateStatus, onViewHistory }: Props) {
  const { getCountryByCode } = useCountries();
  const country = getCountryByCode(request.country);

  // Use status code if available, otherwise fall back to status name
  const statusDisplayName = request.status?.code 
    ? getStatusName(request.status.code)
    : request.status?.name || 'Desconocido';
  const statusColor = request.status?.code
    ? getStatusColor(request.status.code)
    : 'bg-gray-100 text-gray-800';

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 ${
        isNew ? 'ring-2 ring-blue-500 animate-pulse' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span>{country?.icon || '🌍'}</span>
            <span>{request.fullName}</span>
          </h3>
          <p className="text-sm text-gray-500">{request.documentId}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}
        >
          {statusDisplayName}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">País</p>
          <p className="text-sm font-medium text-gray-900">
            {country?.name || request.country}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Monto Solicitado</p>
          <p className="text-sm font-medium text-gray-900">
            ${request.requestedAmount.toLocaleString()} {country?.currency}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Ingreso Mensual</p>
          <p className="text-sm font-medium text-gray-900">
            ${request.monthlyIncome.toLocaleString()} {country?.currency}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Fecha Solicitud</p>
          <p className="text-sm font-medium text-gray-900">
            {new Date(request.requestedAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="text-xs text-gray-400 border-t pt-3 mb-3">
        Última actualización:{' '}
        {new Date(request.updatedAt).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(request)}
          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
        >
          Ver Detalles
        </button>
        <button
          onClick={() => onUpdateStatus(request)}
          className="flex-1 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
        >
          Actualizar Estado
        </button>
        <button
          onClick={() => onViewHistory(request)}
          className="px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
          title="Ver historial de cambios"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
