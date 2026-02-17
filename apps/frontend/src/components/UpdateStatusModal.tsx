import { useState } from 'react';
import { CreditRequest, StatusOption } from '../types';
import { Alert } from './Alert';

interface UpdateStatusModalProps {
  creditRequest: CreditRequest;
  onUpdate: (statusCode: string, reason?: string) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

// Available statuses based on the backend
const STATUS_OPTIONS: StatusOption[] = [
  { code: 'CREATED', name: 'Creado', color: 'bg-gray-100 text-gray-800' },
  { code: 'EVALUATING', name: 'Evaluando', color: 'bg-blue-100 text-blue-800' },
  { code: 'PENDING_FOR_BANK_DATA', name: 'Información Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { code: 'APPROVED', name: 'Aprobado', color: 'bg-green-100 text-green-800' },
  { code: 'REJECTED', name: 'Rechazado', color: 'bg-red-100 text-red-800' },
];

export function UpdateStatusModal({ creditRequest, onUpdate, onCancel, isLoading }: UpdateStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [apiError, setApiError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!selectedStatus) {
      setValidationError('Por favor selecciona un estado');
      return;
    }

    try {
      await onUpdate(selectedStatus, reason || undefined);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el estado';
      setApiError(errorMessage);
      console.error('Status update error:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Actualizar Estado
          </h2>

          {/* API Error Alert */}
          {apiError && (
            <Alert
              type="error"
              message={apiError}
              onClose={() => setApiError('')}
              className="mb-4"
            />
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600">Solicitud ID:</p>
            <p className="text-sm font-mono text-gray-900">{creditRequest.id}</p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">Cliente:</p>
            <p className="font-medium text-gray-900">{creditRequest.fullName}</p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">Estado actual:</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
              STATUS_OPTIONS.find(s => s.name.toLowerCase() === creditRequest.status.name.toLowerCase())?.color || 'bg-gray-100 text-gray-800'
            }`}>
              {creditRequest.status.name}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nuevo Estado *
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setValidationError('');
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationError ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                <option value="">-- Selecciona un estado --</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.code} value={status.code}>
                    {status.name}
                  </option>
                ))}
              </select>
              {validationError && (
                <p className="text-red-500 text-sm mt-1">{validationError}</p>
              )}
            </div>

            {/* Reason textarea */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón del cambio (opcional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                maxLength={1000}
                placeholder="Describe el motivo del cambio de estado..."
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                {reason.length}/1000 caracteres
              </p>
            </div>

            {/* Preview of selected status */}
            {selectedStatus && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-gray-600 mb-1">Vista previa:</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  STATUS_OPTIONS.find(s => s.code === selectedStatus)?.color
                }`}>
                  {STATUS_OPTIONS.find(s => s.code === selectedStatus)?.name}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedStatus}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isLoading ? 'Actualizando...' : 'Actualizar Estado'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
