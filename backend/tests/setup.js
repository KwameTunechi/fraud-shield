// backend/tests/setup.js
// Runs once before any test file in the suite.
// Flushes the test Redis DB and clears the blockchain ledger so every run
// starts from a known-clean state regardless of what previous runs left behind.
import { pool } from '../src/db/pool.js';
import { redis } from '../src/db/redis.js';

export default async function setup() {
  await redis.flushdb();                         // clear all rate-limit keys
  await pool.query('DELETE FROM blockchain_entries'); // start chain from scratch
}
