import { PgBoss } from "pg-boss";
import { Job } from "./types";
import { IJobManager, JobTypeMapping } from "../../domain/ports/jobs";
import { AppError } from "../../domain/errors/app-error";

export class JobManager implements IJobManager{
  private readonly boss: PgBoss;
  private jobs = new Map<string, Job<any>>();

  constructor(boss: PgBoss) {
    this.boss = boss;
  }

  register(generateJob: (boss: PgBoss) => Job<any>): JobManager {
    const jobInstance = generateJob(this.boss)
    this.jobs.set(jobInstance.type, jobInstance);
    return this;
  }

  async start(): Promise<void> {
    try {
      await this.boss.start();
      for (const job of this.jobs.values()) {
        await this.boss.createQueue(job.type);
        await job.start();
      }
    } catch (error: any) {
      throw new AppError('DATABASE_CONNECTION_FAILED', 'Failed to start job manager', {
        error: error.message,
      });
    }
  }

  async emit<K extends keyof JobTypeMapping, T>(jobName: K, payload: T): Promise<void> {
    const job = this.jobs.get(jobName);
    if (job === undefined) {
      throw new AppError('JOB_NOT_REGISTERED', `No job registered with the name ${jobName}`, {
        jobName,
        availableJobs: Array.from(this.jobs.keys()),
      });
    }

    try {
      await job.emit(payload);
    } catch (error: any) {
      throw new AppError('JOB_EXECUTION_FAILED', `Failed to emit job ${jobName}`, {
        jobName,
        error: error.message,
        payload,
      });
    }
  }

}
