// backend/src/server.js
import 'dotenv/config';
import app from './app.js';
import { pool } from './db/pool.js';
import { connectRedis } from './db/redis.js';
import { startLedgerVerifier } from './jobs/verifyLedger.js';

const PORT = process.env.PORT || 3000;

async function start() {
  // Verify database is reachable before accepting traffic
  await pool.query('SELECT 1');
  console.log('PostgreSQL connected');

  await connectRedis();
  console.log('Redis connected');

  app.listen(PORT, () => {
    console.log(`FraudShield API running on http://localhost:${PORT}`);
  });

  startLedgerVerifier();
  console.log('Ledger integrity verifier started (interval: 10 min)');
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
