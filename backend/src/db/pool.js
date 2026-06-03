// backend/src/db/pool.js
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Run a query and return rows directly
export async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

// Run multiple queries inside a single transaction.
// Automatically commits on success and rolls back on error.
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
