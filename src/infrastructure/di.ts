import { CountryRules } from "../core/domain/ports/rules";
import { ColombiaRules } from "../core/domain/rules/colombia-rules";
import { MexicoRules } from "../core/domain/rules/mexico-rules";
import { CreateCreditRequestUseCase } from "../core/domain/use-cases";
import { CreateCreditRequestValidator } from "../core/domain/validators/create-credit-request-validator";
import { CreditRequestRepository } from "./adapters/repositories/credit-request-repository";

const creditRequestRepository = new CreditRequestRepository();

const countryRules: CountryRules[] = [
  new ColombiaRules(),
  new MexicoRules(),
]

const creditRequestValidator = new CreateCreditRequestValidator(countryRules); //change this

export const createCreditRequestUseCase = new CreateCreditRequestUseCase(creditRequestRepository, { getStatusByCode() { return Promise.resolve("")} },  creditRequestValidator);

export const getCreditRequestUseCase = createCreditRequestUseCase//change this
export const listCreditRequestsUseCase = createCreditRequestUseCase//change this
export const updateCreditRequestStatusUseCase = createCreditRequestUseCase//change this
