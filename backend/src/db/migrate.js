// backend/src/db/migrate.js
// Run with: npm run db:migrate
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = readFileSync(
    resolve(__dirname, 'migrations/001_initial_schema.sql'),
    'utf8'
  );
  await pool.query(sql);
  console.log('Migration complete — all tables created.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
