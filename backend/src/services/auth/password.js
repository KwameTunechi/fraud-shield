// backend/src/services/auth/password.js
import bcrypt from 'bcrypt';

const ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

// Hashes a plain-text password. bcrypt is intentionally slow — brute-force attacks
// become impractical even if the hash database is leaked.
export async function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS);
}

// Returns true if plain matches the stored hash, false otherwise.
export async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}
