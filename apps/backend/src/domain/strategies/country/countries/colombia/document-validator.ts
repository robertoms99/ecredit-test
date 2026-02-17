import type { IDocumentValidator } from '../../document-validator.interface';
import type { DocumentValidationResult } from '../../types';
import { COLOMBIA_CONFIG } from './config';

export class ColombiaDocumentValidator implements IDocumentValidator {
  getDocumentType(): string {
    return 'CC';
  }

  async validate(documentId: string): Promise<DocumentValidationResult> {
    const errors: string[] = [];

    if (!documentId || documentId.trim() === '') {
      errors.push('CC (Cédula de Ciudadanía) is required');
      return { isValid: false, errors };
    }

    const cc = documentId.trim();

    if (cc.length < 6 || cc.length > 10) {
      errors.push('CC must be between 6 and 10 digits');
    }

    if (COLOMBIA_CONFIG.documentIdPattern && !COLOMBIA_CONFIG.documentIdPattern.test(cc)) {
      errors.push('CC must contain only numeric digits');
    }

    if (/^0+$/.test(cc)) {
      errors.push('CC cannot be all zeros');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }


}
