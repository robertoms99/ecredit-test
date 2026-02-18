import Redis from 'ioredis';
import { config } from '../../config';

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
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
}
