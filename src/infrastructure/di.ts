
import * as PgB from 'pg-boss';
import { connectionString, db } from './db/client';
import { config } from '../config';

import { CreditRequestRepository } from './adapters/repositories/credit-request-repository';
import { RequestStatusRepository } from './adapters/repositories/request-status-repository';
import { BankInfoRepository } from './adapters/repositories/bank-info-repository';
import {
  CountryStrategyRegistry,
  createCountryStrategies,
} from '../domain/strategies/country';
import {
  StatusTransitionRegistry,
  CreatedStatusTransition,
  EvaluatingStatusTransition,
} from '../domain/strategies/transitions';
import { CreateCreditRequestUseCase } from '../domain/use-cases/create-credit-request';
import { ProcessExternalBankDataUseCase } from '../domain/use-cases/process-external-bank-data';
import { StatusTransitionJob } from '../domain/jobs/status-transition-job';
import { JobManager } from './jobs/jobs-manager';


const creditRequestRepository = new CreditRequestRepository(db);
const requestStatusRepository = new RequestStatusRepository(db);
const bankInfoRepository = new BankInfoRepository(db);

const webhookCallbackUrl = `http://localhost:${config.server.port}/api/webhook`;
const countryStrategies = createCountryStrategies(webhookCallbackUrl);
const countryStrategyRegistry = new CountryStrategyRegistry();

for (const strategy of countryStrategies) {
  const countryCode = strategy.getConfig().code;
  countryStrategyRegistry.register(countryCode, strategy);
}

const statusTransitionRegistry = new StatusTransitionRegistry();

const pgBoss = new PgB.PgBoss(connectionString);
const jobManager = new JobManager(pgBoss);

const createdTransition = new CreatedStatusTransition(
  countryStrategyRegistry,
  bankInfoRepository,
  creditRequestRepository,
  requestStatusRepository,
  jobManager
);

const evaluatingTransition = new EvaluatingStatusTransition(
  countryStrategyRegistry,
  bankInfoRepository,
  creditRequestRepository,
  requestStatusRepository,
  jobManager
);

statusTransitionRegistry.register(createdTransition);
statusTransitionRegistry.register(evaluatingTransition);


jobManager.register(
  (boss) =>
    new StatusTransitionJob(boss, creditRequestRepository, statusTransitionRegistry)
);

await jobManager.start();

export const createCreditRequestUseCase = new CreateCreditRequestUseCase(
  creditRequestRepository,
  requestStatusRepository,
  countryStrategyRegistry,
  jobManager
);

export const processExternalBankDataUseCase = new ProcessExternalBankDataUseCase(
  creditRequestRepository,
  requestStatusRepository,
  bankInfoRepository,
  countryStrategyRegistry,
  jobManager
);

// TODO: Implement these use cases
export const getCreditRequestUseCase = createCreditRequestUseCase; // change this
export const listCreditRequestsUseCase = createCreditRequestUseCase; // change this
export const updateCreditRequestStatusUseCase = createCreditRequestUseCase; // change this
