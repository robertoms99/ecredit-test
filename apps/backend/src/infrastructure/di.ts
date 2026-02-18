
import * as PgB from 'pg-boss';
import { connectionString, db } from './db/client';
import { config } from '../config';
import { WebSocketServer } from './websocket/websocket-server';
import { httpServer } from './http-server';

import { CreditRequestRepository } from './adapters/repositories/credit-request-repository';
import { CachedCreditRequestRepository } from './adapters/repositories/decorators/cached-credit-request-repository';
import { RedisCache } from './cache/redis-cache';
import { RequestStatusRepository } from './adapters/repositories/request-status-repository';
import { CachedRequestStatusRepository } from './adapters/repositories/decorators/cached-request-status-repository';
import { BankInfoRepository } from './adapters/repositories/bank-info-repository';
import { StatusTransitionRepository } from './adapters/repositories/status-transition-repository';
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
import { GetCreditRequestUseCase } from '../domain/use-cases/get-credit-request';
import { ListCreditRequestsUseCase } from '../domain/use-cases/list-credit-requests';
import { UpdateCreditRequestStatusUseCase } from '../domain/use-cases/update-credit-request-status';
import { GetStatusHistoryUseCase } from '../domain/use-cases/get-status-history';
import { ListRequestStatusesUseCase } from '../domain/use-cases/list-request-statuses';
import { ListCountriesUseCase } from '../domain/use-cases/list-countries';
import { LoginUseCase } from '../domain/use-cases/login';
import { JwtTokenSigner, BcryptPasswordHasher } from './adapters/auth/jwt-token-signer';
import { UserRepository } from './adapters/repositories/user-repository';
import { HttpClient } from './adapters/http/http-client';
import { StatusTransitionJob } from '../domain/jobs/status-transition-job';
import { PgBossJobDispatcher } from './jobs/jobs-dispatcher';
import { DatabaseNotificationListener } from './db/notification-listener';

export const wsServer = new WebSocketServer(httpServer);

const redisCache = new RedisCache(config.cache.redisUrl);
const creditRequestRepository = new CachedCreditRequestRepository(
  new CreditRequestRepository(db),
  redisCache,
  config.cache.defaultTtlSeconds,
);
const requestStatusRepository = new CachedRequestStatusRepository(
  new RequestStatusRepository(db),
  redisCache,
  300,
);
const bankInfoRepository = new BankInfoRepository(db);
const statusTransitionRepository = new StatusTransitionRepository(db);

const webhookCallbackUrl = `${config.server.originApi}/api/webhook/process-bank-data`;
const httpClient = new HttpClient();
const countryStrategies = createCountryStrategies(webhookCallbackUrl, httpClient);
const countryStrategyRegistry = new CountryStrategyRegistry();

for (const strategy of countryStrategies) {
  const countryCode = strategy.getConfig().code;
  countryStrategyRegistry.register(countryCode, strategy);
}

const statusTransitionRegistry = new StatusTransitionRegistry();

const pgBoss = new PgB.PgBoss(connectionString);
const jobDispatcher = new PgBossJobDispatcher(pgBoss);

const createdTransition = new CreatedStatusTransition(
  countryStrategyRegistry,
  bankInfoRepository,
  creditRequestRepository,
  requestStatusRepository,
  statusTransitionRepository
);

const evaluatingTransition = new EvaluatingStatusTransition(
  countryStrategyRegistry,
  bankInfoRepository,
  creditRequestRepository,
  requestStatusRepository,
  statusTransitionRepository
);

statusTransitionRegistry.register(createdTransition);
statusTransitionRegistry.register(evaluatingTransition);

jobDispatcher.register(new StatusTransitionJob(creditRequestRepository, statusTransitionRegistry));

await jobDispatcher.start();

const dbNotificationListener = new DatabaseNotificationListener(
  connectionString,
  jobDispatcher,
  wsServer
);

await dbNotificationListener.start();

export const createCreditRequestUseCase = new CreateCreditRequestUseCase(
  creditRequestRepository,
  requestStatusRepository,
  countryStrategyRegistry,
  statusTransitionRepository
);

export const processExternalBankDataUseCase = new ProcessExternalBankDataUseCase(
  creditRequestRepository,
  requestStatusRepository,
  bankInfoRepository,
  countryStrategyRegistry,
  statusTransitionRepository
);

export const getCreditRequestUseCase = new GetCreditRequestUseCase(creditRequestRepository);

export const listCreditRequestsUseCase = new ListCreditRequestsUseCase(creditRequestRepository);

export const updateCreditRequestStatusUseCase = new UpdateCreditRequestStatusUseCase(
  creditRequestRepository,
  requestStatusRepository,
  statusTransitionRepository
);

export const getStatusHistoryUseCase = new GetStatusHistoryUseCase(
  statusTransitionRepository,
  creditRequestRepository
);

export const listRequestStatusesUseCase = new ListRequestStatusesUseCase(
  requestStatusRepository
);

export const listCountriesUseCase = new ListCountriesUseCase(
  countryStrategyRegistry
);

const userRepository = new UserRepository();
const tokenSigner = new JwtTokenSigner();
const passwordHasher = new BcryptPasswordHasher();
export const loginUseCase = new LoginUseCase(userRepository, tokenSigner, passwordHasher);

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
