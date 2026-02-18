import type { ICountryStrategy } from '../country-strategy.interface';
import type { IHttpClient } from '../../../ports/http-client';
import { MexicoStrategy } from './mexico/mexico-strategy';
import { ColombiaStrategy } from './colombia/colombia-strategy';

export function createCountryStrategies(callbackUrl: string, httpClient: IHttpClient): ICountryStrategy[] {
  return [
    new MexicoStrategy(callbackUrl, httpClient),
    new ColombiaStrategy(callbackUrl,httpClient),
  ];
}
