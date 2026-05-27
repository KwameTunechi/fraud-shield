import { describe, it, expect } from 'vitest'
import {
  statusStyle, riskColor, catColor, riskLabel,
  classifyRisk, filterByStatus, filterByMinRisk,
} from './riskUtils.js'
import { buildTransaction } from '../test/factories.js'

describe('statusStyle', () => {
  it('returns green palette for Safe transactions', () => {
    const style = statusStyle('Safe')
    expect(style.color).toBe('#16a34a')
    expect(style.bg).toBe('#f0fdf4')
    expect(style.border).toBe('#bbf7d0')
  })

  it('returns amber palette for Review transactions', () => {
    const style = statusStyle('Review')
    expect(style.color).toBe('#d97706')
  })

  it('returns red palette for Blocked transactions', () => {
    const style = statusStyle('Blocked')
    expect(style.color).toBe('#dc2626')
  })

  it('returns neutral palette for unknown status', () => {
    const style = statusStyle('Pending')
    expect(style.color).toBe('#64748b')
  })
})

describe('riskColor', () => {
  it('returns green for scores below 30', () => {
    expect(riskColor(0)).toBe('#16a34a')
    expect(riskColor(12)).toBe('#16a34a')
    expect(riskColor(29)).toBe('#16a34a')
  })

  it('returns amber for scores between 30 and 59', () => {
    expect(riskColor(30)).toBe('#d97706')
    expect(riskColor(45)).toBe('#d97706')
    expect(riskColor(59)).toBe('#d97706')
  })

  it('returns red for scores 60 and above', () => {
    expect(riskColor(60)).toBe('#dc2626')
    expect(riskColor(87)).toBe('#dc2626')
    expect(riskColor(100)).toBe('#dc2626')
  })
})

describe('catColor', () => {
  it('returns purple for AGENT category', () => {
    expect(catColor('AGENT')).toBe('#8b5cf6')
  })

  it('returns blue for CUSTOMER category', () => {
    expect(catColor('CUSTOMER')).toBe('#3b82f6')
  })

  it('returns blue for any unrecognised category', () => {
    expect(catColor('OTHER')).toBe('#3b82f6')
  })
})

describe('riskLabel', () => {
  it('labels scores below 30 as Low', () => {
    expect(riskLabel(0)).toBe('Low')
    expect(riskLabel(29)).toBe('Low')
  })

  it('labels scores 30–59 as Medium', () => {
    expect(riskLabel(30)).toBe('Medium')
    expect(riskLabel(59)).toBe('Medium')
  })

  it('labels scores 60+ as High', () => {
    expect(riskLabel(60)).toBe('High')
    expect(riskLabel(100)).toBe('High')
  })
})

describe('classifyRisk', () => {
  it('returns score, label, and color together', () => {
    const result = classifyRisk(75)
    expect(result).toEqual({ score: 75, label: 'High', color: '#dc2626' })
  })
})

describe('filterByStatus', () => {
  const txns = [
    buildTransaction({ status: 'Safe' }),
    buildTransaction({ status: 'Review' }),
    buildTransaction({ status: 'Blocked' }),
    buildTransaction({ status: 'Safe' }),
  ]

  it('returns all transactions when status is empty string', () => {
    expect(filterByStatus(txns, '')).toHaveLength(4)
  })

  it('filters to only Safe transactions', () => {
    const result = filterByStatus(txns, 'Safe')
    expect(result).toHaveLength(2)
    expect(result.every((t) => t.status === 'Safe')).toBe(true)
  })

  it('returns an empty array when no transactions match', () => {
    expect(filterByStatus(txns, 'Pending')).toHaveLength(0)
  })
})

describe('filterByMinRisk', () => {
  const txns = [
    buildTransaction({ risk: 10 }),
    buildTransaction({ risk: 45 }),
    buildTransaction({ risk: 87 }),
  ]

  it('returns only transactions meeting or exceeding the threshold', () => {
    const result = filterByMinRisk(txns, 40)
    expect(result).toHaveLength(2)
    expect(result.every((t) => t.risk >= 40)).toBe(true)
  })

  it('returns all transactions when threshold is 0', () => {
    expect(filterByMinRisk(txns, 0)).toHaveLength(3)
  })

  it('returns no transactions when threshold is above all scores', () => {
    expect(filterByMinRisk(txns, 100)).toHaveLength(0)
  })
})
