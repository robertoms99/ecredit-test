import { format } from 'date-fns';
import { CreditRequest } from '../types';
import { useCountries } from '../contexts/CountriesContext';

interface CreditRequestDetailsModalProps {
  creditRequest: CreditRequest;
  onClose: () => void;
}

export function CreditRequestDetailsModal({ creditRequest, onClose }: CreditRequestDetailsModalProps) {
  const { getCountryByCode } = useCountries();
  const country = getCountryByCode(creditRequest.country);

  const formatCurrency = (amount: number) => {
    const currencyCode = country?.currency || 'USD';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss");
  };

  const getStatusColor = (statusName: string) => {
    const status = statusName.toLowerCase();
    if (status === 'created') return 'bg-gray-100 text-gray-800';
    if (status === 'evaluating') return 'bg-blue-100 text-blue-800';
    if (status === 'pending_info') return 'bg-yellow-100 text-yellow-800';
    if (status === 'approved') return 'bg-green-100 text-green-800';
    if (status === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Detalles de la Solicitud
              </h2>
              <p className="text-sm text-gray-500 mt-1">ID: {creditRequest.id}</p>
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

          {/* Status Badge */}
          <div className="mb-6">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(creditRequest.status.name)}`}>
              {creditRequest.status.name}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Información Personal
              </h3>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Nombre Completo</label>
                <p className="text-gray-900 mt-1">{creditRequest.fullName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Documento de Identidad</label>
                <p className="text-gray-900 mt-1">{creditRequest.documentId}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">País</label>
                <p className="text-gray-900 mt-1">
                  {country ? `${country.icon} ${country.name}` : creditRequest.country}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Usuario ID</label>
                <p className="text-gray-900 mt-1 text-sm font-mono">{creditRequest.userId}</p>
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Información Financiera
              </h3>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Monto Solicitado</label>
                <p className="text-gray-900 mt-1 text-xl font-bold text-blue-600">
                  {formatCurrency(creditRequest.requestedAmount)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Ingreso Mensual</label>
                <p className="text-gray-900 mt-1 text-lg font-semibold">
                  {formatCurrency(creditRequest.monthlyIncome)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Relación Deuda/Ingreso</label>
                <p className="text-gray-900 mt-1">
                  {((creditRequest.requestedAmount / creditRequest.monthlyIncome) * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Historial
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Fecha de Solicitud</p>
                    <p className="text-sm text-gray-600">{formatDate(creditRequest.requestedAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Fecha de Creación</p>
                    <p className="text-sm text-gray-600">{formatDate(creditRequest.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Última Actualización</p>
                    <p className="text-sm text-gray-600">{formatDate(creditRequest.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
