import { describe, it, expect } from 'vitest'
import { pad, formatTime, formatDate, formatGhsCurrency, truncate, getInitials } from './formatUtils.js'

describe('pad', () => {
  it('pads single digit numbers with a leading zero', () => {
    expect(pad(5)).toBe('05')
    expect(pad(0)).toBe('00')
    expect(pad(9)).toBe('09')
  })

  it('leaves two-digit numbers unchanged', () => {
    expect(pad(10)).toBe('10')
    expect(pad(59)).toBe('59')
  })
})

describe('formatTime', () => {
  it('formats a Date as HH:MM:SS with zero-padding', () => {
    // Arrange — a specific known time
    const date = new Date('2026-05-27T09:05:03')

    // Act
    const result = formatTime(date)

    // Assert
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    expect(result).toContain(':05:03')
  })

  it('pads midnight as 00:00:00', () => {
    const midnight = new Date('2026-05-27T00:00:00')
    expect(formatTime(midnight)).toBe('00:00:00')
  })
})

describe('formatDate', () => {
  it('returns a long human-readable date string', () => {
    const date = new Date('2026-05-27T12:00:00')
    const result = formatDate(date)

    expect(result).toContain('2026')
    expect(result.length).toBeGreaterThan(10)
  })
})

describe('formatGhsCurrency', () => {
  it('formats a numeric value with the ₵ prefix and 2 decimal places', () => {
    expect(formatGhsCurrency(1250)).toBe('₵1,250.00')
    expect(formatGhsCurrency(0)).toBe('₵0.00')
    expect(formatGhsCurrency(8900.5)).toBe('₵8,900.50')
  })

  it('passes pre-formatted strings through unchanged', () => {
    expect(formatGhsCurrency('₵1,250.00')).toBe('₵1,250.00')
  })
})

describe('truncate', () => {
  it('returns the original string when it is within the limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello')
    expect(truncate('Hello', 5)).toBe('Hello')
  })

  it('truncates a long string and appends an ellipsis', () => {
    const result = truncate('FraudShield Platform', 10)
    expect(result).toHaveLength(10)
    expect(result.endsWith('…')).toBe(true)
  })
})

describe('getInitials', () => {
  it('returns up to two uppercase initials from a full name', () => {
    expect(getInitials('Kwame Mensah')).toBe('KM')
    expect(getInitials('Ama')).toBe('A')
  })

  it('ignores extra name parts beyond the first two', () => {
    expect(getInitials('John Michael Smith')).toBe('JM')
  })

  it('handles extra whitespace gracefully', () => {
    expect(getInitials('  Kofi  Owusu  ')).toBe('KO')
  })
})
