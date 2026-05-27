import { describe, it, expect } from 'vitest'
import {
  AppError, ValidationError, NetworkError, AuthError,
  FraudDetectionError, BlockchainError,
  isRetryable, toUserMessage,
} from './index.js'

describe('AppError', () => {
  it('sets name, code, message, and timestamp', () => {
    // Arrange & Act
    const err = new AppError('Something failed', { code: 'CUSTOM', context: { userId: '42' } })

    // Assert
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('AppError')
    expect(err.code).toBe('CUSTOM')
    expect(err.message).toBe('Something failed')
    expect(err.context).toEqual({ userId: '42' })
    expect(err.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('serialises to a plain object via toJSON', () => {
    const err = new AppError('Oops', { code: 'ERR' })
    const json = err.toJSON()

    expect(json).toMatchObject({
      name: 'AppError',
      code: 'ERR',
      message: 'Oops',
    })
    expect(json).not.toHaveProperty('stack')
  })

  it('defaults code to APP_ERROR when not provided', () => {
    const err = new AppError('Default code')
    expect(err.code).toBe('APP_ERROR')
  })
})

describe('ValidationError', () => {
  it('carries field, issues, and correct error code', () => {
    // Arrange
    const issues = [{ path: 'email', message: 'Invalid email' }]

    // Act
    const err = new ValidationError('Invalid input', { field: 'email', issues })

    // Assert
    expect(err.name).toBe('ValidationError')
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.field).toBe('email')
    expect(err.issues).toEqual(issues)
  })

  it('is an instance of AppError', () => {
    expect(new ValidationError('bad')).toBeInstanceOf(AppError)
  })
})

describe('NetworkError', () => {
  it('stores statusCode, endpoint, and retryable flag', () => {
    // Arrange & Act
    const err = new NetworkError('Request failed', {
      statusCode: 503,
      endpoint: '/api/transactions',
      retryable: true,
    })

    // Assert
    expect(err.name).toBe('NetworkError')
    expect(err.statusCode).toBe(503)
    expect(err.endpoint).toBe('/api/transactions')
    expect(err.retryable).toBe(true)
  })

  it('defaults retryable to true', () => {
    const err = new NetworkError('Timeout')
    expect(err.retryable).toBe(true)
  })
})

describe('AuthError', () => {
  it('stores the reason and correct code', () => {
    const err = new AuthError('Session expired', { reason: 'TOKEN_EXPIRED' })

    expect(err.name).toBe('AuthError')
    expect(err.code).toBe('AUTH_ERROR')
    expect(err.reason).toBe('TOKEN_EXPIRED')
  })
})

describe('FraudDetectionError', () => {
  it('stores transactionId and riskScore', () => {
    const err = new FraudDetectionError('High risk transaction', {
      transactionId: 'TXN-001',
      riskScore: 92,
    })

    expect(err.transactionId).toBe('TXN-001')
    expect(err.riskScore).toBe(92)
  })
})

describe('BlockchainError', () => {
  it('stores blockHash and operation', () => {
    const err = new BlockchainError('Verification failed', {
      blockHash: '0xabc123',
      operation: 'verify',
    })

    expect(err.blockHash).toBe('0xabc123')
    expect(err.operation).toBe('verify')
  })
})

describe('isRetryable', () => {
  it('returns true for a retryable NetworkError', () => {
    expect(isRetryable(new NetworkError('Timeout', { retryable: true }))).toBe(true)
  })

  it('returns false for a non-retryable NetworkError', () => {
    expect(isRetryable(new NetworkError('Not found', { retryable: false }))).toBe(false)
  })

  it('returns false for ValidationError (non-transient)', () => {
    expect(isRetryable(new ValidationError('Bad email'))).toBe(false)
  })

  it('returns false for AuthError', () => {
    expect(isRetryable(new AuthError('Expired'))).toBe(false)
  })

  it('returns false for a plain AppError', () => {
    expect(isRetryable(new AppError('Generic'))).toBe(false)
  })
})

describe('toUserMessage', () => {
  it('returns the original message for ValidationError', () => {
    const err = new ValidationError('Email is required')
    expect(toUserMessage(err)).toBe('Email is required')
  })

  it('returns a generic auth message for AuthError', () => {
    expect(toUserMessage(new AuthError('Token expired'))).toMatch(/Authentication failed/)
  })

  it('returns a network message for NetworkError', () => {
    expect(toUserMessage(new NetworkError('Timeout'))).toMatch(/network error/i)
  })

  it('returns a safe fallback for unknown errors', () => {
    expect(toUserMessage(new Error('Internal boom'))).toMatch(/unexpected error/i)
  })
})
