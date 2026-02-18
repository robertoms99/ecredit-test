import { useCountries } from '../contexts/CountriesContext';

interface Props {
  country: string;
  onCountryChange: (country: string) => void;
}

export function CountryFilter({ country, onCountryChange }: Props) {
  const { countries, isLoading } = useCountries();

  if (isLoading) {
    return (
      <div className="flex gap-2">
        <div className="px-4 py-2 bg-gray-100 rounded-lg animate-pulse w-20 h-10" />
        <div className="px-4 py-2 bg-gray-100 rounded-lg animate-pulse w-24 h-10" />
        <div className="px-4 py-2 bg-gray-100 rounded-lg animate-pulse w-24 h-10" />
      </div>
    );
  }

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
      {countries.map((c) => (
        <button
          key={c.code}
          onClick={() => onCountryChange(c.code)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            country === c.code
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {c.icon} {c.name}
        </button>
      ))}
    </div>
  );
}
