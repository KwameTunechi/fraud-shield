import { describe, it, expect } from 'vitest'
import {
  TransactionSchema, CustomerSchema, SignInSchema, OtpSchema, AlertSchema,
  safeParseTransaction, safeParseSignIn, safeParseOtp, parseOrThrow,
} from './index.js'
import { ValidationError } from '../errors/index.js'
import { buildTransaction, buildCustomer, buildAuthForm, buildAlert } from '../test/factories.js'

// ---------------------------------------------------------------------------
// TransactionSchema
// ---------------------------------------------------------------------------
describe('TransactionSchema', () => {
  it('accepts a valid transaction object', () => {
    const txn = buildTransaction()
    const result = TransactionSchema.safeParse(txn)
    expect(result.success).toBe(true)
  })

  it('rejects a transaction with an invalid status', () => {
    const txn = buildTransaction({ status: 'Pending' })
    const result = TransactionSchema.safeParse(txn)
    expect(result.success).toBe(false)
  })

  it('rejects a risk score outside 0–100', () => {
    const overScore = TransactionSchema.safeParse(buildTransaction({ risk: 150 }))
    const underScore = TransactionSchema.safeParse(buildTransaction({ risk: -1 }))
    expect(overScore.success).toBe(false)
    expect(underScore.success).toBe(false)
  })

  it('rejects a malformed phone number', () => {
    const txn = buildTransaction({ phone: '0244567890' })
    const result = TransactionSchema.safeParse(txn)
    expect(result.success).toBe(false)
    expect(result.error.issues[0].message).toMatch(/Ghana phone number/)
  })

  it('rejects a malformed amount string', () => {
    const txn = buildTransaction({ amount: '$1250' })
    expect(TransactionSchema.safeParse(txn).success).toBe(false)
  })

  it('rejects a malformed time string', () => {
    const txn = buildTransaction({ time: '2:30 PM' })
    expect(TransactionSchema.safeParse(txn).success).toBe(false)
  })

  it('accepts both CUSTOMER and AGENT categories', () => {
    expect(TransactionSchema.safeParse(buildTransaction({ category: 'CUSTOMER' })).success).toBe(true)
    expect(TransactionSchema.safeParse(buildTransaction({ category: 'AGENT' })).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// CustomerSchema
// ---------------------------------------------------------------------------
describe('CustomerSchema', () => {
  it('accepts a valid customer', () => {
    expect(CustomerSchema.safeParse(buildCustomer()).success).toBe(true)
  })

  it('rejects a trust score above 100', () => {
    const result = CustomerSchema.safeParse(buildCustomer({ trustScore: 105 }))
    expect(result.success).toBe(false)
  })

  it('rejects a name shorter than 2 characters', () => {
    const result = CustomerSchema.safeParse(buildCustomer({ name: 'A' }))
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// SignInSchema
// ---------------------------------------------------------------------------
describe('SignInSchema', () => {
  it('accepts a valid email and password', () => {
    const result = safeParseSignIn(buildAuthForm())
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email format', () => {
    const result = safeParseSignIn(buildAuthForm({ email: 'not-an-email' }))
    expect(result.success).toBe(false)
    expect(result.error.issues[0].message).toMatch(/valid email/)
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = safeParseSignIn(buildAuthForm({ password: 'short' }))
    expect(result.success).toBe(false)
    expect(result.error.issues[0].message).toMatch(/8 characters/)
  })
})

// ---------------------------------------------------------------------------
// OtpSchema
// ---------------------------------------------------------------------------
describe('OtpSchema', () => {
  it('accepts a valid 6-digit code', () => {
    expect(safeParseOtp({ code: '123456' }).success).toBe(true)
  })

  it('rejects codes shorter than 6 digits', () => {
    expect(safeParseOtp({ code: '1234' }).success).toBe(false)
  })

  it('rejects codes containing non-digit characters', () => {
    expect(safeParseOtp({ code: '12345a' }).success).toBe(false)
  })

  it('rejects codes longer than 6 digits', () => {
    expect(safeParseOtp({ code: '1234567' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// AlertSchema
// ---------------------------------------------------------------------------
describe('AlertSchema', () => {
  it('accepts a valid alert', () => {
    const alert = buildAlert()
    expect(AlertSchema.safeParse(alert).success).toBe(true)
  })

  it('rejects an invalid severity level', () => {
    const alert = buildAlert({ severity: 'critical' })
    expect(AlertSchema.safeParse(alert).success).toBe(false)
  })

  it('rejects a non-ISO timestamp', () => {
    const alert = buildAlert({ timestamp: 'May 27, 2026' })
    expect(AlertSchema.safeParse(alert).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// parseOrThrow
// ---------------------------------------------------------------------------
describe('parseOrThrow', () => {
  it('returns parsed data for a valid input', () => {
    const result = parseOrThrow(SignInSchema, buildAuthForm(), 'auth form')
    expect(result.email).toBe('admin@fraudshield.com')
  })

  it('throws a ValidationError for invalid input', () => {
    expect(() =>
      parseOrThrow(SignInSchema, { email: 'bad', password: 'x' }, 'auth form')
    ).toThrow(ValidationError)
  })

  it('includes the first issue message in the thrown error', () => {
    try {
      parseOrThrow(SignInSchema, { email: 'bad', password: 'x' })
    } catch (e) {
      expect(e.message).toContain('Invalid')
      expect(e.issues.length).toBeGreaterThan(0)
    }
  })
})
