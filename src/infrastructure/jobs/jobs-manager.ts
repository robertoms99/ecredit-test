import { PgBoss } from "pg-boss";
import { Job } from "./types";
import { IJobManager, JobTypeMapping } from "../../domain/ports/jobs";

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
    await this.boss.start();
    for (const job of this.jobs.values()) {
      await this.boss.createQueue(job.type);
      await job.start();
    }
  }

  async emit<K extends keyof JobTypeMapping, T>(jobName: K, payload: T): Promise<void> {
    const job = this.jobs.get(jobName);
    if (job === undefined) {
      throw new Error(`No job registered with the name ${jobName}`);
    }
    await job.emit(payload);
  }

}
