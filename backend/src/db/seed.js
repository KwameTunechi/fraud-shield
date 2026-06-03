// backend/src/db/seed.js
// Inserts a test admin and a test customer for local development.
// Run with: npm run db:seed
import bcrypt from 'bcrypt';
import { pool } from './pool.js';

async function seed() {
  // Seed admin — logs in via the web dashboard
  const passwordHash = await bcrypt.hash('Password123!', 12);
  await pool.query(
    `INSERT INTO admins (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    ['admin@fraudshield.test', passwordHash, 'Test Admin', 'super_admin']
  );
  console.log('Admin seeded: admin@fraudshield.test / Password123!');

  // Seed customer — uses the mobile app
  const pinHash = await bcrypt.hash('1234', 12);
  await pool.query(
    `INSERT INTO users (phone_number, pin_hash, full_name, balance)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (phone_number) DO NOTHING`,
    ['+233200000001', pinHash, 'Akua Mensah', 1500.00]
  );
  console.log('Customer seeded: +233200000001 / PIN 1234 / Balance ₵1,500.00');

  // Seed a second customer so send-money tests have a recipient
  await pool.query(
    `INSERT INTO users (phone_number, pin_hash, full_name, balance)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (phone_number) DO NOTHING`,
    ['+233200000002', pinHash, 'Kofi Boateng', 500.00]
  );
  console.log('Customer seeded: +233200000002 / PIN 1234 / Balance ₵500.00');

  console.log('\nSeed complete.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
