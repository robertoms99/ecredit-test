import {  PgBoss, Job as PGBossJob, SendOptions } from "pg-boss";
import { JobTypeMapping } from "../../domain/ports/jobs";
import { Job } from "../../infrastructure/jobs/types";

export abstract class BaseJob<T extends object> implements Job<T> {
  protected boss: PgBoss;
  abstract readonly type: keyof JobTypeMapping;
  readonly options: SendOptions  = { retryLimit: 5, retryDelay: 5 };

  constructor(boss: PgBoss) {
    this.boss = boss;
  }

  async start(): Promise<void> {
    await this.boss.work<T>(this.type, this.work);
  }

  abstract work(job: PGBossJob<T>[]): Promise<void>;

  async emit(data: T): Promise<void> {
    await this.boss.send(this.type, data, this.options);
  }
}
