import { RequestStatus } from '../types';

interface Props {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  statuses: RequestStatus[];
}

export function AdvancedFilters({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  selectedStatus,
  onStatusChange,
  statuses,
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

  return (
    <div className="flex flex-wrap gap-4 items-end">
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
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
      {(dateFrom || dateTo || selectedStatus) && (
        <button
          onClick={() => {
            onDateFromChange('');
            onDateToChange('');
            onStatusChange('');
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
