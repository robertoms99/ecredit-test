import { useState, FormEvent } from 'react';
import { CreateCreditRequestPayload } from '../types';

interface CreateCreditRequestFormProps {
  onSubmit: (data: CreateCreditRequestPayload) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function CreateCreditRequestForm({ onSubmit, onCancel, isLoading }: CreateCreditRequestFormProps) {
  const [formData, setFormData] = useState<CreateCreditRequestPayload>({
    country: 'MX',
    fullName: '',
    documentId: '',
    requestedAmount: 0,
    monthlyIncome: 0,
    // userId is now extracted from JWT token automatically
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    }

    if (!formData.documentId.trim()) {
      newErrors.documentId = 'El documento de identidad es requerido';
    }

    if (formData.requestedAmount <= 0) {
      newErrors.requestedAmount = 'El monto debe ser mayor a 0';
    }

    if (formData.monthlyIncome <= 0) {
      newErrors.monthlyIncome = 'El ingreso mensual debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handling is done in parent component
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Nueva Solicitud de Crédito
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Crear solicitud a nombre del cliente
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                País *
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="MX">🇲🇽 México</option>
                <option value="CO">🇨🇴 Colombia</option>
              </select>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo del Cliente *
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Juan Pérez García"
                disabled={isLoading}
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Document ID */}
            <div>
              <label htmlFor="documentId" className="block text-sm font-medium text-gray-700 mb-1">
                Documento de Identidad del Cliente *
              </label>
              <input
                id="documentId"
                type="text"
                value={formData.documentId}
                onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.documentId ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={formData.country === 'MX' ? 'RFC' : 'Cédula'}
                disabled={isLoading}
              />
              {errors.documentId && (
                <p className="text-red-500 text-sm mt-1">{errors.documentId}</p>
              )}
            </div>

            {/* Requested Amount */}
            <div>
              <label htmlFor="requestedAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Monto Solicitado * ({formData.country === 'MX' ? 'MXN' : 'COP'})
              </label>
              <input
                id="requestedAmount"
                type="number"
                value={formData.requestedAmount || ''}
                onChange={(e) => setFormData({ ...formData, requestedAmount: Number(e.target.value) })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.requestedAmount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
                step="0.01"
                disabled={isLoading}
              />
              {errors.requestedAmount && (
                <p className="text-red-500 text-sm mt-1">{errors.requestedAmount}</p>
              )}
            </div>

            {/* Monthly Income */}
            <div>
              <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700 mb-1">
                Ingreso Mensual * ({formData.country === 'MX' ? 'MXN' : 'COP'})
              </label>
              <input
                id="monthlyIncome"
                type="number"
                value={formData.monthlyIncome || ''}
                onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.monthlyIncome ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
                step="0.01"
                disabled={isLoading}
              />
              {errors.monthlyIncome && (
                <p className="text-red-500 text-sm mt-1">{errors.monthlyIncome}</p>
              )}
            </div>

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
                disabled={isLoading}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isLoading ? 'Creando...' : 'Crear Solicitud'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
