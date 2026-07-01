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
           VALUES ('integrity_violation', 'Blockchain Integrity Violation Detected', $1, 'critical')`,
          [`The automated ledger audit detected a hash mismatch at entry ${result.badAt}. This may indicate data tampering or a storage anomaly. Immediate review is recommended.`]
        );
      } else {
        // Chain is healthy — auto-resolve any open integrity violation alerts
        await pool.query(
          `UPDATE alerts SET resolved = true, resolved_at = NOW()
           WHERE type = 'integrity_violation' AND resolved = false`
        );
      }
    } catch (err) {
      console.error('Ledger verify job failed:', err.message);
    }
  }, INTERVAL_MS);
}
