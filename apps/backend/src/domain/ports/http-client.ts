export interface IHttpClient {
  post<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<T>;
}
