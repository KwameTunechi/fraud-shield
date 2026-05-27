import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withTimeout, withRetry, createCircuitBreaker } from './async.js'
import { NetworkError } from '../errors/index.js'

describe('withTimeout', () => {
  it('resolves with the promise value when it settles within the timeout', async () => {
    // Arrange
    const fast = Promise.resolve('done')

    // Act
    const result = await withTimeout(fast, 100)

    // Assert
    expect(result).toBe('done')
  })

  it('rejects with a NetworkError when the promise exceeds the timeout', async () => {
    // Arrange
    const slow = new Promise((resolve) => setTimeout(resolve, 500))

    // Act & Assert
    await expect(withTimeout(slow, 50, 'slow op')).rejects.toThrow(NetworkError)
    await expect(withTimeout(new Promise((r) => setTimeout(r, 500)), 50, 'slow op'))
      .rejects.toThrow(/slow op timed out/)
  })

  it('clears the timer when the promise resolves before the deadline', async () => {
    const timerSpy = vi.spyOn(globalThis, 'clearTimeout')
    await withTimeout(Promise.resolve('ok'), 200)
    expect(timerSpy).toHaveBeenCalled()
  })
})

describe('withRetry', () => {
  it('returns the value on the first successful attempt', async () => {
    // Arrange
    const fn = vi.fn().mockResolvedValue('success')

    // Act
    const result = await withRetry(fn)

    // Assert
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledOnce()
  })

  it('retries up to maxAttempts times before throwing', async () => {
    // Arrange
    const err = new NetworkError('Timeout')
    const fn = vi.fn().mockRejectedValue(err)

    // Act & Assert
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toThrow(NetworkError)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('succeeds on the second attempt after one failure', async () => {
    // Arrange
    const fn = vi.fn()
      .mockRejectedValueOnce(new NetworkError('flaky'))
      .mockResolvedValueOnce('ok')

    // Act
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 })

    // Assert
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('does not retry when shouldRetry returns false', async () => {
    // Arrange
    const fn = vi.fn().mockRejectedValue(new Error('permanent'))

    // Act & Assert
    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 1, shouldRetry: () => false })
    ).rejects.toThrow('permanent')
    expect(fn).toHaveBeenCalledOnce()
  })
})

describe('createCircuitBreaker', () => {
  let breaker

  beforeEach(() => {
    breaker = createCircuitBreaker({ failureThreshold: 2, resetAfterMs: 100 })
  })

  it('starts in closed state', () => {
    expect(breaker.state).toBe('closed')
  })

  it('opens after reaching the failure threshold', async () => {
    // Arrange
    const failing = vi.fn().mockRejectedValue(new Error('down'))

    // Act — trigger failures up to the threshold
    await expect(breaker.call(failing)).rejects.toThrow()
    await expect(breaker.call(failing)).rejects.toThrow()

    // Assert
    expect(breaker.state).toBe('open')
  })

  it('rejects immediately with NetworkError when open', async () => {
    // Arrange — force open
    const fail = vi.fn().mockRejectedValue(new Error('down'))
    await expect(breaker.call(fail)).rejects.toThrow()
    await expect(breaker.call(fail)).rejects.toThrow()

    // Act & Assert — next call should be immediately rejected
    await expect(breaker.call(vi.fn())).rejects.toThrow(NetworkError)
  })

  it('resets to closed state after the reset window', async () => {
    // Arrange — open the breaker
    const fail = vi.fn().mockRejectedValue(new Error('down'))
    await expect(breaker.call(fail)).rejects.toThrow()
    await expect(breaker.call(fail)).rejects.toThrow()

    // Act — wait past reset window
    await new Promise((r) => setTimeout(r, 150))

    // Assert — state transitions back to closed
    expect(breaker.state).toBe('closed')
  })

  it('resets failure count after a successful call', async () => {
    // Arrange
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('one fail'))
      .mockResolvedValueOnce('ok')

    await expect(breaker.call(fn)).rejects.toThrow()
    await breaker.call(fn)

    // Assert — one failure then reset, should still be closed
    expect(breaker.state).toBe('closed')
    expect(breaker.failures).toBe(0)
  })
})
