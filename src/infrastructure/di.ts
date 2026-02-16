import { CountryRules } from "../domain/ports/rules"
import { ColombiaRules } from "../domain/rules/colombia-rules";
import { MexicoRules } from "../domain/rules/mexico-rules";
import { CreateCreditRequestUseCase } from "../domain/use-cases";
import { CreateCreditRequestValidator } from "../domain/validators/create-credit-request-validator";
import { CreditRequestRepository } from "./adapters/repositories/credit-request-repository";
import { RequestStatusRepository } from "./adapters/repositories/request-status-repository";
import { db } from "./db/client";

const creditRequestRepository = new CreditRequestRepository(db);
const requestStatusRepository = new RequestStatusRepository(db);

const countryRules: CountryRules[] = [
  new ColombiaRules(),
  new MexicoRules(),
]

const creditRequestValidator = new CreateCreditRequestValidator(countryRules); //change this

export const createCreditRequestUseCase = new CreateCreditRequestUseCase(creditRequestRepository,  requestStatusRepository,  creditRequestValidator);

export const getCreditRequestUseCase = createCreditRequestUseCase//change this
export const listCreditRequestsUseCase = createCreditRequestUseCase//change this
export const updateCreditRequestStatusUseCase = createCreditRequestUseCase//change this
