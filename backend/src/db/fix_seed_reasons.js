// One-time script to backfill realistic risk reasons on seeded transactions
// that have empty metadata.reasons arrays.
// Run with: node src/db/fix_seed_reasons.js

import { pool } from './pool.js';

const { rows: txs } = await pool.query(`
  SELECT t.*, s.id AS sid
  FROM transactions t
  JOIN users s ON s.id = t.sender_id
  WHERE t.metadata->>'reasons' = '[]'
    AND t.risk_score > 0
`);

console.log(`Found ${txs.length} transactions with empty reasons`);

for (const tx of txs) {
  const reasons = [];
  const hour    = new Date(tx.created_at).getUTCHours();
  const amount  = Number(tx.amount);
  const score   = tx.risk_score;

  // Infer reasons from what we know about each transaction
  if (hour >= 22 || hour < 5)                    reasons.push('late_night');
  if (amount > 2000)                              reasons.push('amount_above_2000_ghs');

  // For seeded transactions recipient is always "new" at seed time
  if (score >= 15 && !reasons.includes('late_night')) reasons.push('new_recipient');

  // High scores without a recipient flag → amount_3x or recipient_flagged
  if (score >= 70 && !reasons.includes('recipient_flagged_in_alerts')) {
    reasons.push('recipient_flagged_in_alerts');
  } else if (score >= 50 && score < 70 && reasons.length < 2) {
    reasons.push('recipient_flagged_in_alerts');
  } else if (score >= 35 && reasons.length < 2) {
    reasons.push('amount_3x_rolling_avg');
  }

  await pool.query(
    `UPDATE transactions SET metadata = $1 WHERE id = $2`,
    [JSON.stringify({ reasons }), tx.id]
  );
  console.log(`  ✓ ${tx.reference} (score: ${score}) → [${reasons.join(', ')}]`);
}

console.log('Done.');
await pool.end();
