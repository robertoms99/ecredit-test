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
      errors.push('CC (Cédula de Ciudadanía) es requerida');
      return { isValid: false, errors };
    }

    const cc = documentId.trim();

    if (cc.length < 6 || cc.length > 10) {
      errors.push('CC debe tener entre 6 y 10 dígitos');
    }

    if (COLOMBIA_CONFIG.documentIdPattern && !COLOMBIA_CONFIG.documentIdPattern.test(cc)) {
      errors.push('CC debe contener solo dígitos numéricos');
    }

    if (/^0+$/.test(cc)) {
      errors.push('CC no puede ser todo ceros');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }


}
