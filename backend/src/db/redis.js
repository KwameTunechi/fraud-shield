// backend/src/db/redis.js
import Redis from 'ioredis';
import 'dotenv/config';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => console.error('Redis error:', err));

// ioredis connects automatically on creation — ping confirms it's live
export async function connectRedis() {
  await redis.ping();
}
