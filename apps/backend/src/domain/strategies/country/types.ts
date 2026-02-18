export interface DocumentValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface CreditEvaluationResult {
  approved: boolean;
  reason: string;
  score?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedAmount?: number;
  metadata?: Record<string, any>;
}

export interface CountryConfig {
  code: string;
  name: string;
  icon: string;
  amountLimit: number;
  currency: string;
  providerUrl: string;
  providerName: string;
  documentIdPattern?: RegExp;
  minCreditScore?: number;
  maxDebtToIncomeRatio?: number;
}

export interface ExternalBankData {
  externalRequestId: string;
  payload: Record<string, any>;
}
