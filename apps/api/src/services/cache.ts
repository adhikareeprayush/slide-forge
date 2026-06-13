import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
  }
  return redis;
}

const CACHE_TTL = 60 * 60 * 24; // 24 hours

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await getRedis().get(`cache:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown): Promise<void> {
  try {
    await getRedis().set(`cache:${key}`, JSON.stringify(value), 'EX', CACHE_TTL);
  } catch {
    // cache miss is non-fatal
  }
}

export function cacheKey(...parts: string[]): string {
  return parts.join(':');
}
