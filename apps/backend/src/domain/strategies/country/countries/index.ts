import type { ICountryStrategy } from '../country-strategy.interface';
import { MexicoStrategy } from './mexico/mexico-strategy';
import { ColombiaStrategy } from './colombia/colombia-strategy';

export function createCountryStrategies(callbackUrl: string): ICountryStrategy[] {
  return [
    new MexicoStrategy(callbackUrl),
    new ColombiaStrategy(callbackUrl),
  ];
}
