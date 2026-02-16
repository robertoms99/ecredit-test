# Country Strategy Composition Pattern - Guía Completa

## 📋 Resumen

Se ha implementado exitosamente el **Country Strategy Composition Pattern** que elimina completamente los condicionales y facilita agregar nuevos países al sistema de crédito.

## 🎯 Problema Resuelto

### ❌ Antes (Código Antiguo)
```typescript
// Múltiples registries dispersos
if (country === 'MX') {
  validator = mexicoValidator;
  provider = mexicoProvider;
  evaluator = mexicoEvaluator;
} else if (country === 'CO') {
  validator = colombiaValidator;
  provider = colombiaProvider;
  evaluator = colombiaEvaluator;
}
```

### ✅ Ahora (Nuevo Sistema)
```typescript
// ¡Sin condicionales! Polimorfismo puro
const strategy = countryStrategyRegistry.get(country);
const validator = strategy.getDocumentValidator();
const provider = strategy.getBankDataProvider();
const evaluator = strategy.getCreditEvaluator();
```

## 🏗️ Arquitectura Nueva

### Estructura de Directorios

```
src/domain/strategies/
├── country/                               # ⭐ Nuevo patrón principal
│   ├── types.ts                          # Tipos compartidos
│   ├── country-strategy.interface.ts     # Interfaz principal del facade
│   ├── country-strategy.registry.ts      # Registry sin condicionales
│   ├── document-validator.interface.ts   # Validación de documentos
│   ├── credit-evaluator.interface.ts     # Evaluación de crédito
│   ├── bank-data-provider.interface.ts   # Integración bancaria
│   ├── external-data-validator.interface.ts  # Validación webhook
│   ├── index.ts                          # Exports públicos
│   └── countries/                        # ⭐ Implementaciones por país
│       ├── index.ts                      # Auto-registro
│       ├── mexico/
│       │   ├── config.ts                 # ⚙️ Configuración MX
│       │   ├── document-validator.ts     # Validación CURP
│       │   ├── credit-evaluator.ts       # Scoring MX
│       │   ├── bank-data-provider.ts     # Proveedor MX
│       │   ├── external-data-validator.ts # Validación webhook MX
│       │   └── mexico-strategy.ts        # 🎭 Facade que compone todo
│       └── colombia/
│           ├── config.ts                 # ⚙️ Configuración CO
│           ├── document-validator.ts     # Validación CC
│           ├── credit-evaluator.ts       # Scoring CO
│           ├── bank-data-provider.ts     # Proveedor CO
│           ├── external-data-validator.ts # Validación webhook CO
│           └── colombia-strategy.ts      # 🎭 Facade que compone todo
│
└── transitions/                          # ⭐ Transiciones de estado
    ├── status-transition.interface.ts
    ├── status-transition.registry.ts
    ├── created-transition.ts             # CREATED → PENDING_FOR_BANK_DATA
    ├── evaluating-transition.ts          # EVALUATING → APPROVED/REJECTED
    └── index.ts
```

## 🔄 Flujo Completo del Sistema

### 1️⃣ Creación de Solicitud
```
POST /api/credit-request
  ↓
CreateCreditRequestUseCase
  ↓
countryStrategy.getDocumentValidator().validate(CURP/CC)
  ↓
countryStrategy.getConfig().amountLimit  // Validar límite país
  ↓
Create en DB con status CREATED
  ↓
Emit job: credit_request_status_change
```

### 2️⃣ Transición CREATED (Job Background)
```
StatusTransitionJob recibe el job
  ↓
CreatedStatusTransition.execute()
  ↓
countryStrategy.getBankDataProvider().fetchBankData()
  ↓
POST al proveedor externo (MX/CO)
  ↓
Guardar BankingInfo con externalRequestId
  ↓
Update status → PENDING_FOR_BANK_DATA
```

### 3️⃣ Webhook de Proveedor
```
POST /api/webhook (desde proveedor externo)
  ↓
ProcessExternalBankDataUseCase
  ↓
countryStrategy.getExternalDataValidator().validate(payload)
  ↓
Update BankingInfo.financialData
  ↓
Update status → EVALUATING
  ↓
Emit job: credit_request_status_change
```

### 4️⃣ Evaluación (Job Background)
```
StatusTransitionJob recibe el job
  ↓
EvaluatingStatusTransition.execute()
  ↓
countryStrategy.getCreditEvaluator().evaluate(request, bankData)
  ↓
Análisis: score, DTI, límites, riesgo
  ↓
Update status → APPROVED o REJECTED
  ↓
Emit job final (notificaciones, logs, etc.)
```

## ➕ Cómo Agregar un Nuevo País (Ejemplo: Brasil)

### Paso 1: Crear la carpeta del país
```bash
mkdir -p src/domain/strategies/country/countries/brazil
```

### Paso 2: Crear config.ts
```typescript
// src/domain/strategies/country/countries/brazil/config.ts
import type { CountryConfig } from '../../types';

export const BRAZIL_CONFIG: CountryConfig = {
  code: 'BR',
  name: 'Brazil',
  amountLimit: 50_000,  // R$50,000
  currency: 'BRL',
  providerUrl: process.env.BRAZIL_PROVIDER_URL || 'http://localhost:5000/providers/br',
  providerName: 'Brazil Bank Data Provider',
  documentIdPattern: /^\d{11}$/,  // CPF: 11 digits
  minCreditScore: 500,
  maxDebtToIncomeRatio: 0.5,
};
```

### Paso 3: Implementar document-validator.ts
```typescript
// src/domain/strategies/country/countries/brazil/document-validator.ts
import type { IDocumentValidator } from '../../document-validator.interface';
import type { DocumentValidationResult } from '../../types';
import { BRAZIL_CONFIG } from './config';

export class BrazilDocumentValidator implements IDocumentValidator {
  getDocumentType(): string {
    return 'CPF';
  }

  async validate(documentId: string): Promise<DocumentValidationResult> {
    const errors: string[] = [];

    if (!documentId || documentId.trim() === '') {
      errors.push('CPF is required');
      return { isValid: false, errors };
    }

    const cpf = documentId.trim().replace(/[.-]/g, '');

    if (cpf.length !== 11) {
      errors.push('CPF must be exactly 11 digits');
    }

    if (!/^\d{11}$/.test(cpf)) {
      errors.push('CPF must contain only digits');
    }

    // TODO: Implementar algoritmo de validación de CPF

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
```

### Paso 4: Implementar credit-evaluator.ts
```typescript
// src/domain/strategies/country/countries/brazil/credit-evaluator.ts
import type { ICreditEvaluator } from '../../credit-evaluator.interface';
import type { CreditRequest } from '../../../../entities/credit-request';
import type { BankingInfo } from '../../../../entities/banking-info';
import type { CreditEvaluationResult } from '../../types';
import { BRAZIL_CONFIG } from './config';

export class BrazilCreditEvaluator implements ICreditEvaluator {
  async evaluate(
    creditRequest: CreditRequest,
    bankingInfo: BankingInfo
  ): Promise<CreditEvaluationResult> {
    // Implementar lógica de scoring específica de Brasil
    // Similar a MexicoCreditEvaluator pero con criterios brasileños
    
    return {
      approved: true,
      reason: 'Credit approved',
      score: 750,
      riskLevel: 'LOW',
    };
  }
}
```

### Paso 5: Implementar bank-data-provider.ts
```typescript
// src/domain/strategies/country/countries/brazil/bank-data-provider.ts
import type { IBankDataProvider } from '../../bank-data-provider.interface';
import type { NewBankingInfo } from '../../../../entities/banking-info';
import { BRAZIL_CONFIG } from './config';
import superagent from 'superagent';

export class BrazilBankDataProvider implements IBankDataProvider {
  constructor(private readonly callbackUrl: string) {}

  async fetchBankData(
    documentId: string,
    creditRequestId: string
  ): Promise<Omit<NewBankingInfo, 'creditRequestId'>> {
    const response = await superagent
      .post(BRAZIL_CONFIG.providerUrl)
      .send({
        document_id: documentId,
        credit_request_id: creditRequestId,
        callback_url: this.callbackUrl,
      })
      .timeout(10000);

    return {
      externalRequestId: response.body.request_id,
      providerName: BRAZIL_CONFIG.providerName,
      fetchStatus: 'PENDING',
      financialData: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
```

### Paso 6: Implementar external-data-validator.ts
```typescript
// src/domain/strategies/country/countries/brazil/external-data-validator.ts
import type { IExternalDataValidator } from '../../external-data-validator.interface';
import type { ExternalBankData } from '../../types';
import { AppError } from '../../../../errors/app-error';

export class BrazilExternalDataValidator implements IExternalDataValidator {
  async validate(data: ExternalBankData): Promise<boolean> {
    const { externalRequestId, payload } = data;

    if (!externalRequestId) {
      throw new AppError('VALIDATION_FAILED', 'External request ID is required');
    }

    const requiredFields = ['debt', 'balance', 'risk_score'];
    const missingFields = requiredFields.filter(field => !(field in payload));

    if (missingFields.length > 0) {
      throw new AppError(
        'VALIDATION_FAILED',
        `Missing fields: ${missingFields.join(', ')}`
      );
    }

    return true;
  }
}
```

### Paso 7: Crear brazil-strategy.ts (Facade)
```typescript
// src/domain/strategies/country/countries/brazil/brazil-strategy.ts
import type { ICountryStrategy } from '../../country-strategy.interface';
import type { IDocumentValidator } from '../../document-validator.interface';
import type { ICreditEvaluator } from '../../credit-evaluator.interface';
import type { IBankDataProvider } from '../../bank-data-provider.interface';
import type { IExternalDataValidator } from '../../external-data-validator.interface';
import type { CountryConfig } from '../../types';
import { BRAZIL_CONFIG } from './config';
import { BrazilDocumentValidator } from './document-validator';
import { BrazilCreditEvaluator } from './credit-evaluator';
import { BrazilBankDataProvider } from './bank-data-provider';
import { BrazilExternalDataValidator } from './external-data-validator';

export class BrazilStrategy implements ICountryStrategy {
  private readonly documentValidator: IDocumentValidator;
  private readonly creditEvaluator: ICreditEvaluator;
  private readonly bankDataProvider: IBankDataProvider;
  private readonly externalDataValidator: IExternalDataValidator;

  constructor(callbackUrl: string) {
    this.documentValidator = new BrazilDocumentValidator();
    this.creditEvaluator = new BrazilCreditEvaluator();
    this.bankDataProvider = new BrazilBankDataProvider(callbackUrl);
    this.externalDataValidator = new BrazilExternalDataValidator();
  }

  getConfig(): CountryConfig {
    return BRAZIL_CONFIG;
  }

  getDocumentValidator(): IDocumentValidator {
    return this.documentValidator;
  }

  getCreditEvaluator(): ICreditEvaluator {
    return this.creditEvaluator;
  }

  getBankDataProvider(): IBankDataProvider {
    return this.bankDataProvider;
  }

  getExternalDataValidator(): IExternalDataValidator {
    return this.externalDataValidator;
  }
}
```

### Paso 8: Registrar en countries/index.ts
```typescript
// src/domain/strategies/country/countries/index.ts
import type { ICountryStrategy } from '../country-strategy.interface';
import { MexicoStrategy } from './mexico/mexico-strategy';
import { ColombiaStrategy } from './colombia/colombia-strategy';
import { BrazilStrategy } from './brazil/brazil-strategy';  // ⭐ NUEVO

export function createCountryStrategies(callbackUrl: string): ICountryStrategy[] {
  return [
    new MexicoStrategy(callbackUrl),
    new ColombiaStrategy(callbackUrl),
    new BrazilStrategy(callbackUrl),  // ⭐ AGREGAR AQUÍ
  ];
}
```

### ¡Listo! 🎉

**ESO ES TODO.** No necesitas tocar:
- ❌ Controllers
- ❌ Use Cases
- ❌ DI Container
- ❌ Jobs
- ❌ Repositories

El auto-registro se encarga del resto.

## 🔍 Diferencias Clave Entre Países

### México vs Colombia

| Característica | México (MX) | Colombia (CO) |
|---------------|-------------|---------------|
| **Documento** | CURP (18 chars) | CC (6-10 digits) |
| **Límite Crédito** | 500,000 MXN | 1,000,000 COP |
| **Score Mínimo** | 600 | 550 |
| **DTI Máximo** | 40% | 45% |
| **Nivel Riesgo** | Más conservador | Más permisivo |
| **Balance Negativo** | No permitido | Hasta -50,000 COP |

## 📊 Ventajas del Nuevo Sistema

### ✅ Beneficios Técnicos
1. **Cero condicionales** - Polimorfismo puro
2. **Auto-registro** - Factory automático
3. **Type-safe** - TypeScript garantiza contrato
4. **Testeable** - Mock de estrategias completas
5. **Extensible** - Agregar país = crear carpeta

### ✅ Beneficios de Negocio
1. **Time-to-market** - Nuevo país en horas, no días
2. **Mantenibilidad** - Código país aislado
3. **Escalabilidad** - Agregar 10 países sin tocar core
4. **Especialización** - Cada país tiene su lógica única
5. **Auditoría** - Fácil de revisar y certificar

## 🧪 Testing

### Ejemplo: Test de Validación de Documento
```typescript
import { MexicoDocumentValidator } from './mexico/document-validator';

describe('MexicoDocumentValidator', () => {
  const validator = new MexicoDocumentValidator();

  it('should validate valid CURP', async () => {
    const result = await validator.validate('ABCD860101HDFRRA09');
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid CURP', async () => {
    const result = await validator.validate('INVALID');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('CURP must be exactly 18 characters');
  });
});
```

### Ejemplo: Test de Evaluación de Crédito
```typescript
import { MexicoCreditEvaluator } from './mexico/credit-evaluator';

describe('MexicoCreditEvaluator', () => {
  const evaluator = new MexicoCreditEvaluator();

  it('should approve low-risk credit', async () => {
    const result = await evaluator.evaluate(mockCreditRequest, mockBankingInfo);
    expect(result.approved).toBe(true);
    expect(result.riskLevel).toBe('LOW');
  });

  it('should reject high debt-to-income ratio', async () => {
    const result = await evaluator.evaluate(highDebtRequest, mockBankingInfo);
    expect(result.approved).toBe(false);
    expect(result.reason).toContain('debt-to-income ratio too high');
  });
});
```

## 🚀 Migraciones Futuras

### Agregar nuevas validaciones
```typescript
// En cada país, simplemente extiende la interfaz
interface ICountryStrategy {
  getDocumentValidator(): IDocumentValidator;
  getCreditEvaluator(): ICreditEvaluator;
  getBankDataProvider(): IBankDataProvider;
  getExternalDataValidator(): IExternalDataValidator;
  // ⭐ NUEVAS validaciones:
  getIdentityVerifier(): IIdentityVerifier;  // Verificación biométrica
  getFraudDetector(): IFraudDetector;        // Detección de fraude
  getCreditBureauAdapter(): ICreditBureauAdapter;  // Buró de crédito
}
```

## 📝 Archivos Clave

### Interfaces Core
- `src/domain/strategies/country/country-strategy.interface.ts`
- `src/domain/strategies/country/document-validator.interface.ts`
- `src/domain/strategies/country/credit-evaluator.interface.ts`
- `src/domain/strategies/country/bank-data-provider.interface.ts`
- `src/domain/strategies/country/external-data-validator.interface.ts`

### Registry & Factory
- `src/domain/strategies/country/country-strategy.registry.ts`
- `src/domain/strategies/country/countries/index.ts`

### Implementaciones
- `src/domain/strategies/country/countries/mexico/`
- `src/domain/strategies/country/countries/colombia/`

### Use Cases
- `src/domain/use-cases/create-credit-request.ts`
- `src/domain/use-cases/process-external-bank-data.ts`

### Jobs & Transitions
- `src/domain/jobs/status-transition-job.ts`
- `src/domain/strategies/transitions/created-transition.ts`
- `src/domain/strategies/transitions/evaluating-transition.ts`

### DI Container
- `src/infrastructure/di.ts`

## 🎓 Patrones Aplicados

1. **Strategy Pattern** - Diferentes algoritmos por país
2. **Facade Pattern** - CountryStrategy oculta complejidad
3. **Registry Pattern** - Mapeo dinámico sin condicionales
4. **Factory Pattern** - Creación automática de estrategias
5. **Dependency Injection** - Inversión de control total
6. **Composition over Inheritance** - Componibilidad de estrategias

## 📚 Referencias

- [Strategy Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/strategy)
- [Composition over Inheritance](https://en.wikipedia.org/wiki/Composition_over_inheritance)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Autor**: Builder Agent  
**Fecha**: 2026-02-16  
**Versión**: 1.0  
**Status**: ✅ Production Ready
