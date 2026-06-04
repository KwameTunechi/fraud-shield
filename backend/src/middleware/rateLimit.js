// backend/src/middleware/rateLimit.js
import { redis } from '../db/redis.js';

// Returns Express middleware that limits requests to `max` per `windowSec` seconds,
// keyed by whatever `getKey(req)` returns (usually an email or IP address).
// Uses Redis INCR + EXPIRE so the counter survives server restarts and works
// across multiple server instances.
export function rateLimit({ keyPrefix, max, windowSec, getKey }) {
  return async (req, res, next) => {
    const id = getKey(req);
    if (!id) return next();

    const key = `rl:${keyPrefix}:${id}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSec);

    if (count > max) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfterSec: windowSec,
      });
    }
    next();
  };
}
