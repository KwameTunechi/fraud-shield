// backend/src/services/auth/pin.js
import bcrypt from 'bcrypt';

// Validates and hashes a 4-digit numeric PIN.
export async function hashPin(pin) {
  if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be exactly 4 digits');
  return bcrypt.hash(pin, 12);
}

export async function verifyPin(pin, hash) {
  if (!pin || !hash) return false;
  return bcrypt.compare(pin, hash);
}
