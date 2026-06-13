import type { Request, Response, NextFunction } from 'express';
import { getRedis } from '../services/cache';

const MAX_PER_HOUR = Number(process.env.MAX_GENERATIONS_PER_HOUR ?? 10);
const WINDOW = 3600;

export async function rateLimitGenerations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const key = `ratelimit:generate:${ip}`;

  try {
    const redis = getRedis();
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, WINDOW);

    if (count > MAX_PER_HOUR) {
      res.status(429).json({
        error: `Rate limit exceeded. Max ${MAX_PER_HOUR} generations per hour.`,
      });
      return;
    }
  } catch {
    // if redis is down, allow request
  }

  next();
}
