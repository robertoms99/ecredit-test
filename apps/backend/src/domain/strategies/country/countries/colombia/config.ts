import type { CountryConfig } from '../../types';

export const COLOMBIA_CONFIG: CountryConfig = {
  code: 'CO',
  name: 'Colombia',
  icon: '🇨🇴',
  amountLimit: 100_000_000,
  currency: 'COP',
  providerUrl: process.env.COLOMBIA_PROVIDER_URL || 'http://localhost:5000/providers/co',
  providerName: 'Colombia Bank Data Provider',
  // CC format: 6-10 digits
  documentIdPattern: /^\d{6,10}$/,
  minCreditScore: 550,
  maxDebtToIncomeRatio: 0.45
};
