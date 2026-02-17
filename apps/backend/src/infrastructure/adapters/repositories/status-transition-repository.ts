import { eq, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { IStatusTransitionRepository } from '../../../domain/ports/repositories/status-transition-repository';
import { StatusTransition, NewStatusTransition } from '../../../domain/entities/status-transition';
import { statusTransitions, requestStatuses } from '../../db/schemas';

export class StatusTransitionRepository implements IStatusTransitionRepository {
  constructor(private readonly db: NodePgDatabase<any>) {}

  async create(transition: NewStatusTransition): Promise<StatusTransition> {
    console.log('[StatusTransitionRepository] Inserting transition:', transition);
    
    try {
      const [created] = await this.db
        .insert(statusTransitions)
        .values(transition)
        .returning();

      console.log('[StatusTransitionRepository] Transition inserted successfully:', created);
      return created;
    } catch (error) {
      console.error('[StatusTransitionRepository] Insert failed:', error);
      throw error;
    }
  }

  async findByCreditRequestId(creditRequestId: string): Promise<StatusTransition[]> {
    const results = await this.db
      .select({
        id: statusTransitions.id,
        reason: statusTransitions.reason,
        triggeredBy: statusTransitions.triggeredBy,
        metadata: statusTransitions.metadata,
        creditRequestId: statusTransitions.creditRequestId,
        fromStatusId: statusTransitions.fromStatusId,
        toStatusId: statusTransitions.toStatusId,
        createdAt: statusTransitions.createdAt,
        fromStatus: {
          id: requestStatuses.id,
          name: requestStatuses.name,
          code: requestStatuses.code,
        },
      })
      .from(statusTransitions)
      .leftJoin(
        requestStatuses,
        eq(statusTransitions.fromStatusId, requestStatuses.id)
      )
      .where(eq(statusTransitions.creditRequestId, creditRequestId))
      .orderBy(desc(statusTransitions.createdAt));

    const transitions = await Promise.all(
      results.map(async (result) => {
        const [toStatus] = await this.db
          .select({
            id: requestStatuses.id,
            name: requestStatuses.name,
            code: requestStatuses.code,
          })
          .from(requestStatuses)
          .where(eq(requestStatuses.id, result.toStatusId))
          .limit(1);

        return {
          id: result.id,
          reason: result.reason,
          triggeredBy: result.triggeredBy,
          metadata: result.metadata,
          creditRequestId: result.creditRequestId,
          fromStatusId: result.fromStatusId,
          toStatusId: result.toStatusId,
          createdAt: result.createdAt,
          fromStatus: result.fromStatus?.id ? result.fromStatus : null,
          toStatus: toStatus || null,
        } as StatusTransition & {
          fromStatus: { id: string; name: string; code: string } | null;
          toStatus: { id: string; name: string; code: string } | null;
        };
      })
    );

    return transitions as StatusTransition[];
  }

  async findLatestByCreditRequestId(creditRequestId: string): Promise<StatusTransition | null> {
    const [transition] = await this.db
      .select()
      .from(statusTransitions)
      .where(eq(statusTransitions.creditRequestId, creditRequestId))
      .orderBy(desc(statusTransitions.createdAt))
      .limit(1);

    return transition || null;
  }
}
