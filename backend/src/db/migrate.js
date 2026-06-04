// backend/src/db/migrate.js
// Run with: npm run db:migrate
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  for (const file of ['001_initial_schema.sql', '002_settings.sql']) {
    const sql = readFileSync(resolve(__dirname, 'migrations', file), 'utf8');
    await pool.query(sql);
    console.log(`  ✓ ${file}`);
  }
  console.log('Migration complete.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
