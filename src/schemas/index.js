import { z } from 'zod'

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const GhanaPhone = z
  .string()
  .regex(/^\+233\s?\d{2}\s?\d{3}\s?\d{4}$/, 'Must be a valid Ghana phone number (+233 XX XXX XXXX)')

const RiskScore = z.number().int().min(0).max(100)

const ISOTimestamp = z.string().datetime({ message: 'Must be an ISO 8601 timestamp' })

// ---------------------------------------------------------------------------
// Transaction schema — mirrors the data shape in LiveTransactions.jsx
// ---------------------------------------------------------------------------

export const TransactionStatus = z.enum(['Safe', 'Review', 'Blocked'])
export const TransactionCategory = z.enum(['CUSTOMER', 'AGENT'])

export const TransactionSchema = z.object({
  id:       z.string().min(1),
  time:     z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Must be HH:MM:SS'),
  customer: z.string().min(1),
  phone:    GhanaPhone,
  amount:   z.string().regex(/^₵[\d,]+\.\d{2}$/, 'Must be a formatted GHS amount (₵X,XXX.XX)'),
  location: z.string().min(1),
  risk:     RiskScore,
  status:   TransactionStatus,
  category: TransactionCategory,
})

export const TransactionArraySchema = z.array(TransactionSchema)

// ---------------------------------------------------------------------------
// Customer schema
// ---------------------------------------------------------------------------

export const CustomerRole = z.enum(['CUSTOMER', 'AGENT'])

export const CustomerSchema = z.object({
  id:         z.string().min(1),
  name:       z.string().min(2),
  phone:      GhanaPhone,
  role:       CustomerRole,
  trustScore: z.number().min(0).max(100),
  mfaEnabled: z.boolean(),
  verified:   z.boolean(),
})

// ---------------------------------------------------------------------------
// Auth form schema — used at the sign-in boundary
// ---------------------------------------------------------------------------

export const SignInSchema = z.object({
  email:    z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const OtpSchema = z.object({
  code: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
})

// ---------------------------------------------------------------------------
// Alert schema
// ---------------------------------------------------------------------------

export const AlertSeverity = z.enum(['info', 'warning', 'danger', 'success'])

export const AlertSchema = z.object({
  id:          z.string().min(1),
  title:       z.string().min(1),
  description: z.string().min(1),
  severity:    AlertSeverity,
  timestamp:   ISOTimestamp,
  read:        z.boolean(),
})

// ---------------------------------------------------------------------------
// Convenience parse helpers — throw ValidationError with structured issues
// ---------------------------------------------------------------------------

import { ValidationError } from '../errors/index.js'

export function parseOrThrow(schema, data, label = 'data') {
  const result = schema.safeParse(data)
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }))
    throw new ValidationError(`Invalid ${label}: ${issues[0]?.message ?? 'unknown'}`, { issues })
  }
  return result.data
}

export function safeParseTransaction(data) { return TransactionSchema.safeParse(data) }
export function safeParseCustomer(data)    { return CustomerSchema.safeParse(data) }
export function safeParseSignIn(data)      { return SignInSchema.safeParse(data) }
export function safeParseOtp(data)         { return OtpSchema.safeParse(data) }
