import type { DocumentValidationResult } from './types';

export interface IDocumentValidator {
  validate(documentId: string): Promise<DocumentValidationResult>;
  getDocumentType(): string;
}
