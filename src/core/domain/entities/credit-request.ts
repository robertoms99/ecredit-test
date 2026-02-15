export interface CreditRequest {
  id: string;
  country: string;
  fullName: string;
  documentId: string;
  requestedAmount: number;
  monthlyIncome: number;
  requestedAt: string;
  statusId: string;
}
