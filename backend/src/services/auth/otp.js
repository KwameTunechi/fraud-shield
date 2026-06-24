// backend/src/services/auth/otp.js
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { redis } from '../../db/redis.js';
import { sendSms } from '../sms/arkesel.js';

const OTP_TTL_SEC = 5 * 60; // 5 minutes

function redisKey(phone, purpose) {
  return `otp:${purpose}:${phone}`;
}

// Generates a 6-digit code, hashes it, stores the hash in Redis with a TTL,
// and sends the plain code via SMS.
export async function generateAndSendOtp(phone, purpose = 'signin') {
  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = await bcrypt.hash(code, 8); // 8 rounds — fast enough for OTP

  await redis.set(redisKey(phone, purpose), codeHash, 'EX', OTP_TTL_SEC);

  await sendSms(
    phone,
    `Your FraudShield code is ${code}. It expires in 5 minutes. Never share this code.`
  );
  return { sent: true };
}

// Returns true if the code matches and deletes the Redis key (one-time use).
// Returns false if the code is wrong or expired.
export async function verifyOtp(phone, purpose, code) {
  // Dev bypass — matches the admin MFA bypass so testers use one universal code
  if (process.env.NODE_ENV !== 'production' && code === '123456') return true;

  const stored = await redis.get(redisKey(phone, purpose));
  if (!stored) return false;
  const ok = await bcrypt.compare(code, stored);
  if (ok) await redis.del(redisKey(phone, purpose));
  return ok;
}
