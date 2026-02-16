import { StatusTransitionJob } from "../domain/jobs/status-transition-job";
import { CountryRules } from "../domain/ports/rules"
import { ColombiaRules } from "../domain/rules/colombia-rules";
import { MexicoRules } from "../domain/rules/mexico-rules";
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

const creditRequestRepository = new CreditRequestRepository(db);
const requestStatusRepository = new RequestStatusRepository(db);

const countryRules: CountryRules[] = [
  new ColombiaRules(),
  new MexicoRules(),
]

const bankDataProviderStrategies: IBankDataProvider[] = [
  new BankDataProviderColombia(),
  new BankDataProviderMexico()
]

const bankDataProviderRegistry = new BankDataProviderRegistry(bankDataProviderStrategies);

const pgBoss = new PgB.PgBoss(connectionString);

const jobManager =
  new JobManager(pgBoss)
    .register((pgBoss)=> new StatusTransitionJob(pgBoss,creditRequestRepository, bankDataProviderRegistry))

await jobManager.start();

const creditRequestValidator = new CreateCreditRequestValidator(countryRules);

export const createCreditRequestUseCase = new CreateCreditRequestUseCase(creditRequestRepository,  requestStatusRepository,  creditRequestValidator, jobManager);

export const getCreditRequestUseCase = createCreditRequestUseCase//change this
export const listCreditRequestsUseCase = createCreditRequestUseCase//change this
export const updateCreditRequestStatusUseCase = createCreditRequestUseCase//change this
