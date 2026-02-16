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

    if (curp.length >= 10) {
      const yearStr = curp.substring(4, 6);
      const monthStr = curp.substring(6, 8);
      const dayStr = curp.substring(8, 10);

      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);

      if (month < 1 || month > 12) {
        errors.push('Invalid month in CURP date');
      }

      if (day < 1 || day > 31) {
        errors.push('Invalid day in CURP date');
      }

      const currentYear = new Date().getFullYear() % 100;
      if (year > currentYear + 10) {
        errors.push('Invalid year in CURP date');
      }
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
