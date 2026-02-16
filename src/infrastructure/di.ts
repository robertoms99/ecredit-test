import { StatusTransitionJob } from "../domain/jobs/status-transition-job";
import { CountryRules } from "../domain/ports/rules"
import { ColombiaRules } from "../domain/strategies/colombia-rules";
import { MexicoRules } from "../domain/strategies/mexico-rules";
import { CreateCreditRequestUseCase } from "../domain/use-cases";
import { CreateCreditRequestValidator } from "../domain/validators/create-credit-request-validator";
import { CreditRequestRepository } from "./adapters/repositories/credit-request-repository";
import { RequestStatusRepository } from "./adapters/repositories/request-status-repository";
import { connectionString, db } from "./db/client";
import * as PgB from 'pg-boss';
import { JobManager } from "./jobs/jobs-manager";
import { BankDataProviderMexico } from "./adapters/strategies/mexico/bank-data-provider";
import { BankDataProviderColombia } from "./adapters/strategies/colombia/bank-data-provider";
import { IBankDataProvider } from "../domain/ports/strategies/bank-data-provider";
import { BankDataProviderRegistry } from "../domain/ports/strategies/bank-data-provider-registry";
import { IStatusTransitionStrategy } from "../domain/ports/strategies/status-transition";
import { StatusTransitionRegistry } from "../domain/ports/strategies/status-transition-registry";
import { ProcessExternalBankDataUseCase } from "../domain/use-cases/process-external-bank-data";
import { ExternalBankDataValidatorRegistry } from "../domain/ports/strategies/external-bank-data-validator-registry";
import { ExternalBankDataValidatorColombia } from "../domain/strategies/colombia/external-bank-data-validator";
import { ExternalBankDataValidatorMexico } from "../domain/strategies/mexico/external-bank-data-validator";
import { CreatedStatusTransition } from "../domain/strategies/created-status-transition";
import { BankInfoRepository } from "./adapters/repositories/bank-info-repository";
import { RequestStatusCodes } from "../domain/entities";

const creditRequestRepository = new CreditRequestRepository(db);
const requestStatusRepository = new RequestStatusRepository(db);
const bankInfoRepository = new BankInfoRepository(db);

const countryRules: CountryRules[] = [
  new ColombiaRules(),
  new MexicoRules(),
]

const bankDataProviderStrategies: IBankDataProvider[] = [
  new BankDataProviderColombia(),
  new BankDataProviderMexico()
]

const bankDataProviderRegistry = new BankDataProviderRegistry(bankDataProviderStrategies);

const statusTransitionStrategies: IStatusTransitionStrategy[] = [
  new CreatedStatusTransition(creditRequestRepository,requestStatusRepository, bankInfoRepository, bankDataProviderRegistry),
]

const statusTransitionRegistry = new StatusTransitionRegistry(statusTransitionStrategies);

const pgBoss = new PgB.PgBoss(connectionString);

const jobManager =
  new JobManager(pgBoss)
    .register((pgBoss)=> new StatusTransitionJob(pgBoss,creditRequestRepository, statusTransitionRegistry))

await jobManager.start();

const creditRequestValidator = new CreateCreditRequestValidator(countryRules);

export const processExternalBankDataUseCase = new ProcessExternalBankDataUseCase(
  creditRequestRepository,
  requestStatusRepository,
  bankInfoRepository,
  new ExternalBankDataValidatorRegistry([
    new ExternalBankDataValidatorColombia(),
    new ExternalBankDataValidatorMexico()
  ]),
  jobManager
);

export const createCreditRequestUseCase = new CreateCreditRequestUseCase(creditRequestRepository,  requestStatusRepository,  creditRequestValidator, jobManager);


export const getCreditRequestUseCase = createCreditRequestUseCase//change this
export const listCreditRequestsUseCase = createCreditRequestUseCase//change this
export const updateCreditRequestStatusUseCase = createCreditRequestUseCase//change this
