import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import logger, { sanitize, entry } from './logger.js'

describe('sanitize', () => {
  it('redacts known-sensitive keys regardless of case', () => {
    const result = sanitize({ password: 'secret123', TOKEN: 'abc', userId: 'u1' })

    expect(result.password).toBe('[REDACTED]')
    expect(result.TOKEN).toBe('[REDACTED]')
    expect(result.userId).toBe('u1')
  })

  it('redacts pin and otp fields', () => {
    const result = sanitize({ pin: '1234', otp: '567890' })
    expect(result.pin).toBe('[REDACTED]')
    expect(result.otp).toBe('[REDACTED]')
  })

  it('passes through non-sensitive fields unchanged', () => {
    const result = sanitize({ requestId: 'r-001', endpoint: '/api/txn' })
    expect(result).toEqual({ requestId: 'r-001', endpoint: '/api/txn' })
  })
})

describe('entry', () => {
  it('includes level, message, and an ISO timestamp', () => {
    const record = entry('info', 'test message', { userId: 'u1' })

    expect(record.level).toBe('info')
    expect(record.message).toBe('test message')
    expect(record.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(record.userId).toBe('u1')
  })

  it('sanitizes meta fields before including them', () => {
    const record = entry('warn', 'attempt', { password: 'hunter2' })
    expect(record.password).toBe('[REDACTED]')
  })
})

describe('logger', () => {
  let consoleSpy

  beforeEach(() => {
    consoleSpy = {
      log:   vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn:  vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('info calls console.log with a structured record', () => {
    logger.info('User signed in', { userId: 'u1' })
    expect(consoleSpy.log).toHaveBeenCalledOnce()
    const [record] = consoleSpy.log.mock.calls[0]
    expect(record.level).toBe('info')
    expect(record.message).toBe('User signed in')
  })

  it('warn calls console.warn', () => {
    logger.warn('High risk detected', { risk: 87 })
    expect(consoleSpy.warn).toHaveBeenCalledOnce()
  })

  it('error calls console.error', () => {
    logger.error('Transaction failed', { txnId: 'TXN-001' })
    expect(consoleSpy.error).toHaveBeenCalledOnce()
  })

  it('logError includes errorName, errorCode, and errorContext', async () => {
    const { AppError } = await import('../errors/index.js')
    const err = new AppError('Oops', { code: 'MY_CODE', context: { txn: 'x' } })

    logger.logError(err, { requestId: 'r-001' })

    const [record] = consoleSpy.error.mock.calls[0]
    expect(record.errorName).toBe('AppError')
    expect(record.errorCode).toBe('MY_CODE')
    expect(record.requestId).toBe('r-001')
  })

  it('logApiCall uses error level for 5xx responses', () => {
    logger.logApiCall({ method: 'POST', endpoint: '/api/tx', statusCode: 503, durationMs: 200 })
    expect(consoleSpy.error).toHaveBeenCalledOnce()
  })

  it('logApiCall uses warn level for 4xx responses', () => {
    logger.logApiCall({ method: 'GET', endpoint: '/api/tx', statusCode: 404, durationMs: 50 })
    expect(consoleSpy.warn).toHaveBeenCalledOnce()
  })

  it('logApiCall uses info level for 2xx responses', () => {
    logger.logApiCall({ method: 'GET', endpoint: '/api/tx', statusCode: 200, durationMs: 30 })
    expect(consoleSpy.log).toHaveBeenCalledOnce()
  })
})
