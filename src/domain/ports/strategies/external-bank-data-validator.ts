
export interface IExternalBankDataValidator {
  supports(country: string): boolean;
  validate(country: string,payload: any): Promise<boolean>
}
