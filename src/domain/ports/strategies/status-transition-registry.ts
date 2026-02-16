import { RequestStatusCodes } from "../../entities";
import { AppError } from "../../errors";
import { IStatusTransitionStrategy } from "./status-transition";

export class StatusTransitionRegistry {
  constructor(private readonly transitions: IStatusTransitionStrategy[]) {}

  get(country: string, requestStatus: RequestStatusCodes): IStatusTransitionStrategy {
    const strategyTransition = this.transitions.find(p => p.supports(country, requestStatus));

    if (!strategyTransition) {
      throw new AppError('VALIDATION_FAILED', `No status transition strategy for ${country} and status = ${requestStatus}`);
    }

    return strategyTransition;
  }
}
