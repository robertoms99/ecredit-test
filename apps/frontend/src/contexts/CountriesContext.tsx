import React, { createContext, useState, useEffect, useContext } from 'react';
import { creditRequestsApi } from '../api/creditRequests';
import { Country } from '../types';

interface CountriesContextType {
  countries: Country[];
  isLoading: boolean;
  error: string | null;
  getCountryByCode: (code: string) => Country | undefined;
}

const CountriesContext = createContext<CountriesContextType | undefined>(undefined);

export const CountriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const data = await creditRequestsApi.getCountries();
        setCountries(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar países');
        console.error('Error loading countries:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCountries();
  }, []);

  const getCountryByCode = (code: string): Country | undefined => {
    return countries.find(c => c.code === code);
  };

  const value: CountriesContextType = {
    countries,
    isLoading,
    error,
    getCountryByCode,
  };

  return <CountriesContext.Provider value={value}>{children}</CountriesContext.Provider>;
};

export const useCountries = (): CountriesContextType => {
  const context = useContext(CountriesContext);
  if (context === undefined) {
    throw new Error('useCountries must be used within a CountriesProvider');
  }
  return context;
};
