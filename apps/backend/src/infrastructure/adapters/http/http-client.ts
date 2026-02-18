import superagent from 'superagent';
import type { IHttpClient } from '../../../domain/ports/http-client';

export class HttpClient implements IHttpClient {
  async post<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<T> {
    const response = await superagent
      .post(url)
      .set('Content-Type', 'application/json')
      .set(headers || {})
      .send(body as object);

    return response.body as T;
  }
}
