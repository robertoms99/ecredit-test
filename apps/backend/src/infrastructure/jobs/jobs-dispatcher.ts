import { Job, PgBoss } from "pg-boss";
import { AppError } from "../../domain/errors/app-error";
import { IJob, IJobDispatcher, JobTypeMapping } from "../../domain/ports/jobs";

export class PgBossJobDispatcher implements IJobDispatcher {
  private jobs = new Map<keyof JobTypeMapping, IJob<any>>();

  constructor(private readonly boss: PgBoss) {}

  register<K extends keyof JobTypeMapping>(job: IJob<K>): void {
    this.jobs.set(job.getType(), job);
  }

  async start(): Promise<void> {
    try {
      await this.boss.start();
      for (const [jobName, job] of this.jobs) {
       await this.boss.createQueue(jobName as string);
        await this.boss.work(jobName, async (pgJobs: Job[]) => {
          for (const pgJob of pgJobs) {
            try {
              await job.work(pgJob.data);
            } catch (error) {
              console.error(`[Job Error] ${String(jobName)} - Job ID: ${pgJob.id}`);
              console.error(error);
              throw error;
            }
          }
        });
      }
    } catch (error: any) {
      throw new AppError('DATABASE_CONNECTION_FAILED', 'Failed to start job dispatcher', {
        error: error.message,
      });
    }
  }

  async emit<K extends keyof JobTypeMapping>(jobName: K, payload: JobTypeMapping[K]): Promise<void> {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new AppError('JOB_NOT_REGISTERED', `No job registered with the name ${String(jobName)}`, {
        jobName,
        availableJobs: Array.from(this.jobs.keys()),
      });
    }
    try {
      await this.boss.send(jobName, payload, job.getOptions());
    } catch (error: any) {
      throw new AppError('JOB_EXECUTION_FAILED', `Failed to emit job ${String(jobName)}`, {
        jobName,
        error: error.message,
        payload,
      });
    }
  }
}
