import type { CountryConfig } from '../../types';

export const MEXICO_CONFIG: CountryConfig = {
  code: 'MX',
  name: 'México',
  icon: '🇲🇽',
  amountLimit: 500_000,
  currency: 'MXN',
  providerUrl: process.env.MEXICO_PROVIDER_URL || 'http://localhost:5000/providers/mx',
  providerName: 'Mexico Bank Data Provider',
  documentIdLabel: 'CURP',
  // CURP format: 4 letters + 6 digits (YYMMDD) + 1 letter + 5 alphanumeric
  documentIdPattern: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/,
  minCreditScore: 600,
  maxDebtToIncomeRatio: 0.4,
};
