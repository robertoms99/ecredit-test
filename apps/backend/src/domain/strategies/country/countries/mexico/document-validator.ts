import type { IDocumentValidator } from '../../document-validator.interface';
import type { DocumentValidationResult } from '../../types';
import { MEXICO_CONFIG } from './config';

export class MexicoDocumentValidator implements IDocumentValidator {
  getDocumentType(): string {
    return 'CURP';
  }

  async validate(documentId: string): Promise<DocumentValidationResult> {
    const errors: string[] = [];

    if (!documentId || documentId.trim() === '') {
      errors.push('CURP is required');
      return { isValid: false, errors };
    }

    const curp = documentId.trim().toUpperCase();

    if (curp.length !== 18) {
      errors.push('CURP must be exactly 18 characters');
    }

    if (MEXICO_CONFIG.documentIdPattern && !MEXICO_CONFIG.documentIdPattern.test(curp)) {
      errors.push('CURP format is invalid. Expected format: AAAA######HHHHH##');
    }

    if (curp.length > 10) {
      const gender = curp[10];
      if (gender !== 'H' && gender !== 'M') {
        errors.push('Invalid gender in CURP (must be H or M)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
