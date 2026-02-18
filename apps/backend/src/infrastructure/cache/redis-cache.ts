import Redis from 'ioredis';
import { config } from '../../config';

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  delPattern(pattern: string): Promise<number>;
}

export class RedisCache implements Cache {
  private client: Redis;

  constructor(url = config.cache.redisUrl) {
    this.client = new Redis(url);
    this.client.on('error', (err) => {
      console.error('[Redis] Error:', err.message);
    });
    this.client.on('connect', () => {
      console.log('[Redis] Connected');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = config.cache.defaultTtlSeconds): Promise<void> {
    const payload = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, payload, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, payload);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, batch] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (batch && batch.length) keys.push(...batch);
    } while (cursor !== '0');
    return keys;
  }

  async delPattern(pattern: string): Promise<number> {
    const keys = await this.keys(pattern);
    if (keys.length === 0) return 0;
    const pipeline = this.client.pipeline();
    for (const k of keys) pipeline.del(k);
    const results = await pipeline.exec();
    const deleted = (results ?? []).reduce((acc, [err, res]) => acc + (err ? 0 : Number(res) || 0), 0);
    return deleted;
  }
}
