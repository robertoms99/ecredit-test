import type { IStatusTransitionStrategy } from './status-transition.interface';
import type { RequestStatusCodes } from '../../entities/request-status';
import { AppError } from '../../errors/app-error';

export class StatusTransitionRegistry {
  private strategies: Map<RequestStatusCodes, IStatusTransitionStrategy> = new Map();

  register(strategy: IStatusTransitionStrategy): void {
    this.strategies.set(strategy.getStatusCode(), strategy);
  }

  get(statusCode: RequestStatusCodes): IStatusTransitionStrategy {
    const strategy = this.strategies.get(statusCode);

    if (!strategy) {
      throw new AppError(
        'VALIDATION_FAILED',
        `No se encontró estrategia de transición para estado '${statusCode}'`,
        { statusCode }
      );
    }

    return strategy;
  }

  has(statusCode: RequestStatusCodes): boolean {
    return this.strategies.has(statusCode);
  }

  getSupportedStatuses(): RequestStatusCodes[] {
    return Array.from(this.strategies.keys());
  }
}
