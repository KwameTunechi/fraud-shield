// backend/src/jobs/verifyLedger.js
// Runs every 10 minutes and verifies the blockchain ledger has not been tampered
// with. If a broken hash is found, a critical alert is inserted so the admin
// dashboard surfaces it immediately.

import { verifyChain } from '../services/blockchain/ledger.js';
import { pool } from '../db/pool.js';

const INTERVAL_MS = 10 * 60 * 1000;

export function startLedgerVerifier() {
  setInterval(async () => {
    try {
      const result = await verifyChain();
      if (!result.ok) {
        console.error('BLOCKCHAIN INTEGRITY VIOLATION:', result);
        await pool.query(
          `INSERT INTO alerts (type, title, description, severity)
           VALUES ('integrity_violation', 'Blockchain integrity violation', $1, 'critical')`,
          [`Bad entry id ${result.badAt}: ${result.reason}`]
        );
      }
    } catch (err) {
      console.error('Ledger verify job failed:', err.message);
    }
  }, INTERVAL_MS);
}
