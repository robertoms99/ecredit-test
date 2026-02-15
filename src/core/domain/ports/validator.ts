export interface IValidator<T> {
  validate(value: T): Promise<void>;
}
