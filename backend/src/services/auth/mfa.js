// backend/src/services/auth/mfa.js
import speakeasy from 'speakeasy';

// Generates a fresh TOTP secret for one admin. Call once at setup time.
// Returns { base32, otpauth_url } — base32 goes in the DB, otpauth_url becomes the QR code.
export function generateMfaSecret(label) {
  return speakeasy.generateSecret({
    name: `FraudShield (${label})`,
    length: 20,
  });
}

// Verifies a 6-digit code. window:1 accepts the previous, current, and next
// 30-second slot — compensates for small clock differences between server and phone.
export function verifyMfaCode(secret, code) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
    window: 1,
  });
}
