import { CountryRules } from "../ports/rules";
import { ICreateCreditRequestUseCase } from "../ports/use-cases/create-credit-request";
import { IValidator } from "../ports/validator";

export class CreateCreditRequestValidator implements IValidator<ICreateCreditRequestUseCase> {
  private  countryRule!: CountryRules;
  constructor(
    private readonly countriesRules: CountryRules[],
  ) {}

  async validate(value: ICreateCreditRequestUseCase): Promise<void> {
    const countryRule = this.countriesRules.find(rule => rule.getCountryCode() === value.country);

    if (!countryRule) {
      throw new Error('Invalid country');
    }

    this.countryRule = countryRule

    this.validateName(value.fullName);
    this.validateRequestedAmount(value.requestedAmount);

    await countryRule.validateDocumentId(value.documentId);
  }

  private validateName(name: string): void {
    if (!name || name.length < 2 || name.length > 100) {
      throw new Error('Invalid name');
    }
  }

  private async validateRequestedAmount(amount: number): Promise<void> {
    if (!amount || amount < 1 || amount > await this.countryRule.getAmountLimit()) {
      throw new Error('Invalid amount');
    }
  }

}
