import { RequestStatus } from '../types';

interface Props {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  statuses: RequestStatus[];
  searchId: string;
  onSearchIdChange: (id: string) => void;
  searchDocumentId: string;
  onSearchDocumentIdChange: (documentId: string) => void;
}

export function AdvancedFilters({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  selectedStatus,
  onStatusChange,
  statuses,
  searchId,
  onSearchIdChange,
  searchDocumentId,
  onSearchDocumentIdChange,
}: Props) {
  // Get today's date in local timezone (YYYY-MM-DD format)
  const getTodayLocal = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getTodayLocal();
  const hasFilters = dateFrom || dateTo || selectedStatus || searchId || searchDocumentId;

  return (
    <div className="flex flex-wrap gap-4 items-end">
      {/* Search by ID */}
      <div className="flex flex-col">
        <label htmlFor="search-id" className="text-sm font-medium text-gray-700 mb-1">
          Buscar por ID
        </label>
        <input
          id="search-id"
          type="text"
          value={searchId}
          onChange={(e) => onSearchIdChange(e.target.value)}
          placeholder="UUID de la solicitud"
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
        />
      </div>

      {/* Search by Document ID */}
      <div className="flex flex-col">
        <label htmlFor="search-document-id" className="text-sm font-medium text-gray-700 mb-1">
          Documento de Identidad
        </label>
        <input
          id="search-document-id"
          type="text"
          value={searchDocumentId}
          onChange={(e) => onSearchDocumentIdChange(e.target.value)}
          placeholder="CURP, Cédula, etc."
          disabled={!!searchId}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-52 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Date From */}
      <div className="flex flex-col">
        <label htmlFor="date-from" className="text-sm font-medium text-gray-700 mb-1">
          Desde
        </label>
        <input
          id="date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          max={dateTo || today}
          disabled={!!searchId}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Date To */}
      <div className="flex flex-col">
        <label htmlFor="date-to" className="text-sm font-medium text-gray-700 mb-1">
          Hasta
        </label>
        <input
          id="date-to"
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          min={dateFrom}
          max={today}
          disabled={!!searchId}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Status Filter */}
      <div className="flex flex-col">
        <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mb-1">
          Estado
        </label>
        <select
          id="status-filter"
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          disabled={!!searchId}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Todos los estados</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters Button */}
      {hasFilters && (
        <button
          onClick={() => {
            onDateFromChange('');
            onDateToChange('');
            onStatusChange('');
            onSearchIdChange('');
            onSearchDocumentIdChange('');
          }}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
