import { SendOptions, Job as JobPGBoss } from "pg-boss";
import { JobTypeMapping } from "../../domain/ports/jobs";

export interface Job<T extends object> {
  type: keyof JobTypeMapping;
  options: SendOptions;
  start: () => Promise<void>;
  work: (job: JobPGBoss<T>[]) => Promise<void>;
  emit: (data: T) => Promise<void>;
}
