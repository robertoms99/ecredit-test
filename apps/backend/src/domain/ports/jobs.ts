import type { RequestStatusCodes } from "../entities";

export type JobTypeMapping = {
  credit_request_status_change: {
    credit_request_id: string;
    request_status_id: string;
    request_status_code: RequestStatusCodes;
    request_status_name?: string;
    updated_at?: string;
  };
};

export interface JobOptions {
  retryLimit?: number;
  retryDelay?: number;
}

export interface IJob<K extends keyof JobTypeMapping> {
  work(payload: JobTypeMapping[K]): Promise<void>;
  getOptions(): JobOptions
  getType(): K
}

export interface IJobDispatcher {
  register<K extends keyof JobTypeMapping>(job: IJob<K>): void;
  emit<K extends keyof JobTypeMapping>(jobName: K, payload: JobTypeMapping[K]): Promise<void>;
  start(): Promise<void>;
}
