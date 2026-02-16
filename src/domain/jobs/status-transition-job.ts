import { PgBoss,SendOptions , Job as PGBossJob} from "pg-boss";
import { JobManager } from "../../infrastructure/jobs/jobs-manager";
import { JobTypeMapping } from "../ports/jobs";
import { BaseJob } from "./base-job";
import { RequestStatusCodes } from "../entities";
import { CreditRequestRepository } from "../../infrastructure/adapters/repositories/credit-request-repository";
import { AppError } from "../errors";
import { BankDataProviderRegistry } from "../ports/strategies/bank-data-provider-registry";
import { StatusTransitionRegistry } from "../ports/strategies/status-transition-registry";

export class StatusTransitionJob extends BaseJob<{credit_request_id: string, request_status_id: string, request_status_code: RequestStatusCodes}> {
  readonly type: keyof JobTypeMapping = "credit_request_status_change";
  readonly options: SendOptions = {
    retryLimit: 3,
    retryDelay: 1000,
  };

  public constructor(boss: PgBoss,
    private readonly creditRequestRepository: CreditRequestRepository,
    private readonly statusTransitionStrategyRegistry: StatusTransitionRegistry
  ) {
    super(boss);
  }

   work = async(jobs: PGBossJob<{ credit_request_id: string, request_status_id: string, request_status_code: RequestStatusCodes }>[]): Promise<void> => {
    for(const job of jobs){
      try {
        const { credit_request_id, request_status_id,request_status_code } = job.data;
        const creditRequest = await this.creditRequestRepository.findById(credit_request_id);

        if(!creditRequest){
          throw new AppError('NOT_FOUND', "Credit request not found");
        }

        if (creditRequest.statusId !== request_status_id) {
          throw new AppError('VALIDATION_FAILED', "Invalid status transition");
        }

        const statusTransitionStrategy = this.statusTransitionStrategyRegistry.get(creditRequest.country, request_status_code )

        await statusTransitionStrategy.execute(creditRequest)

      } catch (error) {
        console.error(error)
        continue
      }
    }
  }
}
