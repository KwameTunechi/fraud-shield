// backend/tests/teardown.js
// Global teardown — runs once in the main thread after all test files complete.
// Closes the setup-phase connections and forces the process to exit so that
// open socket handles from fork workers don't keep the process alive.
import { pool } from '../src/db/pool.js';
import { redis } from '../src/db/redis.js';

export default async function teardown() {
  await pool.end().catch(() => {});
  await redis.quit().catch(() => {});
  process.exit(0); // release any lingering handles from fork workers
}
