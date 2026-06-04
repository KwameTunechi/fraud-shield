// backend/src/services/blockchain/ledger.js
// Append-only, hash-chained audit ledger stored in PostgreSQL.
//
// Why NOT a public blockchain:
//   A private ledger in PostgreSQL gives tamper-evidence (any modification
//   breaks the chain) without gas fees, network latency, or research overhead.
//   For the thesis, the key property is auditability — this delivers it.
//
// Chain structure:
//   entry[0]: previousHash = null,  hash = SHA-256("genesis|eventType|payloadJson")
//   entry[n]: previousHash = entry[n-1].hash,
//             hash = SHA-256(previousHash + "|" + eventType + "|" + payloadJson)
//
// payload is stored as TEXT (not JSONB) so PostgreSQL never reorders JSON keys —
// key order matters because the same string must be reproduced during verification.

import crypto from 'crypto';
import { pool } from '../../db/pool.js';

function computeHash(previousHash, eventType, payloadString) {
  const data = `${previousHash ?? 'genesis'}|${eventType}|${payloadString}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Appends a new entry to the ledger and returns the new hash.
// Wraps SELECT + INSERT in one transaction so the FOR UPDATE lock is held
// until the INSERT commits — prevents two concurrent appends reading the
// same previousHash and breaking the chain.
export async function appendEntry({ eventType, transactionId = null, payload }) {
  const payloadString = JSON.stringify(payload); // serialise ONCE; stored verbatim as TEXT

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: last } = await client.query(
      'SELECT hash FROM blockchain_entries ORDER BY id DESC LIMIT 1 FOR UPDATE'
    );
    const previousHash = last[0]?.hash ?? null;
    const newHash = computeHash(previousHash, eventType, payloadString);

    await client.query(
      `INSERT INTO blockchain_entries
         (hash, previous_hash, event_type, transaction_id, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [newHash, previousHash, eventType, transactionId, payloadString]
    );

    await client.query('COMMIT');
    return newHash;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Walks the entire chain and verifies every hash.
// Returns { ok: true, entries: N } or { ok: false, badAt: id, reason: string }.
export async function verifyChain() {
  // payload is TEXT — the pg driver returns it as a plain string, no parsing
  const { rows } = await pool.query(
    'SELECT * FROM blockchain_entries ORDER BY id ASC'
  );

  let previousHash = null;
  for (const row of rows) {
    if ((row.previous_hash ?? null) !== previousHash) {
      return { ok: false, badAt: row.id, reason: 'broken_chain_link' };
    }
    // row.payload is the exact string that was used to compute the hash
    const expected = computeHash(previousHash, row.event_type, row.payload);
    if (row.hash !== expected) {
      return { ok: false, badAt: row.id, reason: 'hash_mismatch' };
    }
    previousHash = row.hash;
  }
  return { ok: true, entries: rows.length };
}
