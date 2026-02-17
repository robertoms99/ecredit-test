import { StatusTransitionJob } from "../jobs/status-transition-job";

export type JobTypeMapping = {
  credit_request_status_change: StatusTransitionJob;
};

export interface IJobManager {
  emit<K extends keyof JobTypeMapping, T>(jobName: K, payload: Parameters<JobTypeMapping[K]["emit"]>[number]): Promise<void>;
}
