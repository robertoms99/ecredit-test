interface Props {
  country: string;
  onCountryChange: (country: string) => void;
}

export function CountryFilter({ country, onCountryChange }: Props) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onCountryChange('')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          country === ''
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        Todos
      </button>
      <button
        onClick={() => onCountryChange('MX')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          country === 'MX'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        🇲🇽 México
      </button>
      <button
        onClick={() => onCountryChange('CO')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          country === 'CO'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        🇨🇴 Colombia
      </button>
    </div>
  );
}
