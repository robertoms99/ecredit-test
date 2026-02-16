
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
import { DatabaseNotificationListener } from './db/notification-listener';


const creditRequestRepository = new CreditRequestRepository(db);
const requestStatusRepository = new RequestStatusRepository(db);
const bankInfoRepository = new BankInfoRepository(db);

const webhookCallbackUrl = `http://localhost:${config.server.port}/api/webhook/process-bank-data`;
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
  requestStatusRepository
);

const evaluatingTransition = new EvaluatingStatusTransition(
  countryStrategyRegistry,
  bankInfoRepository,
  creditRequestRepository,
  requestStatusRepository
);

statusTransitionRegistry.register(createdTransition);
statusTransitionRegistry.register(evaluatingTransition);


jobManager.register(
  (boss) =>
    new StatusTransitionJob(boss, creditRequestRepository, statusTransitionRegistry)
);

await jobManager.start();

const dbNotificationListener = new DatabaseNotificationListener(
  connectionString,
  jobManager
);

await dbNotificationListener.start();

export const createCreditRequestUseCase = new CreateCreditRequestUseCase(
  creditRequestRepository,
  requestStatusRepository,
  countryStrategyRegistry
);

export const processExternalBankDataUseCase = new ProcessExternalBankDataUseCase(
  creditRequestRepository,
  requestStatusRepository,
  bankInfoRepository,
  countryStrategyRegistry
);

export const getCreditRequestUseCase = createCreditRequestUseCase;
export const listCreditRequestsUseCase = createCreditRequestUseCase;
export const updateCreditRequestStatusUseCase = createCreditRequestUseCase;

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await dbNotificationListener.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await dbNotificationListener.stop();
  process.exit(0);
});
