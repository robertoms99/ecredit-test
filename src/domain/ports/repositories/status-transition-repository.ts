import { StatusTransition, NewStatusTransition } from '../../entities/status-transition';

export interface IStatusTransitionRepository {
  create(transition: NewStatusTransition): Promise<StatusTransition>;
  findByCreditRequestId(creditRequestId: string): Promise<StatusTransition[]>;
  findLatestByCreditRequestId(creditRequestId: string): Promise<StatusTransition | null>;
}
