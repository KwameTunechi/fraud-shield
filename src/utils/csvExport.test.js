import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rowsToCsv, buildAnalyticsCsvRows, triggerCsvDownload, exportAnalyticsCsv } from './csvExport.js'

const SAMPLE_DATA = {
  anomalyData: [
    { time: '00:00', score: 15 },
    { time: '12:00', score: 46 },
  ],
  trendData: [
    { day: 'Mon', risk: 62 },
    { day: 'Fri', risk: 40 },
  ],
  threatCategories: [
    { name: 'Phishing', value: 45, color: '#6366f1' },
    { name: 'Account Takeover', value: 32, color: '#3b82f6' },
  ],
}

describe('rowsToCsv', () => {
  it('converts a simple 2D array to a newline-separated CSV string', () => {
    // Arrange
    const rows = [['ID', 'Name', 'Score'], ['TXN-001', 'Kwame', '12']]

    // Act
    const csv = rowsToCsv(rows)

    // Assert
    expect(csv).toBe('ID,Name,Score\nTXN-001,Kwame,12')
  })

  it('wraps cells containing commas in double-quotes', () => {
    const rows = [['Location', 'Accra, Ghana']]
    expect(rowsToCsv(rows)).toBe('Location,"Accra, Ghana"')
  })

  it('escapes double-quotes inside cell values', () => {
    const rows = [['Note', 'He said "hello"']]
    expect(rowsToCsv(rows)).toBe('Note,"He said ""hello"""')
  })

  it('handles empty rows (section separators) as blank lines', () => {
    const rows = [['A'], [], ['B']]
    expect(rowsToCsv(rows)).toBe('A\n\nB')
  })

  it('handles null and undefined cells gracefully', () => {
    const rows = [[null, undefined, 'ok']]
    expect(rowsToCsv(rows)).toBe(',,ok')
  })
})

describe('buildAnalyticsCsvRows', () => {
  it('includes all three sections with correct headers', () => {
    // Act
    const rows = buildAnalyticsCsvRows(SAMPLE_DATA)
    const flat = rows.flat()

    // Assert
    expect(flat).toContain('Anomaly Detection Score')
    expect(flat).toContain('7-Day Risk Trend')
    expect(flat).toContain('Threats by Category')
  })

  it('maps anomaly data rows correctly', () => {
    const rows = buildAnalyticsCsvRows(SAMPLE_DATA)
    expect(rows).toContainEqual(['00:00', 15])
    expect(rows).toContainEqual(['12:00', 46])
  })

  it('maps trend data rows correctly', () => {
    const rows = buildAnalyticsCsvRows(SAMPLE_DATA)
    expect(rows).toContainEqual(['Mon', 62])
    expect(rows).toContainEqual(['Fri', 40])
  })

  it('maps threat category rows correctly', () => {
    const rows = buildAnalyticsCsvRows(SAMPLE_DATA)
    expect(rows).toContainEqual(['Phishing', 45])
    expect(rows).toContainEqual(['Account Takeover', 32])
  })
})

describe('triggerCsvDownload', () => {
  it('creates an anchor element, sets href and download, and clicks it', () => {
    // Arrange
    const mockAnchor = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)

    // Act
    triggerCsvDownload('a,b\n1,2', 'test.csv')

    // Assert
    expect(mockAnchor.download).toBe('test.csv')
    expect(mockAnchor.click).toHaveBeenCalledOnce()
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('uses export.csv as default filename', () => {
    const mockAnchor = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)
    triggerCsvDownload('data')
    expect(mockAnchor.download).toBe('export.csv')
  })
})

describe('exportAnalyticsCsv', () => {
  beforeEach(() => {
    const mockAnchor = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)
  })

  it('returns the generated CSV string', () => {
    // Act
    const csv = exportAnalyticsCsv(SAMPLE_DATA)

    // Assert — spot-check a few known values appear in the output
    expect(csv).toContain('Anomaly Detection Score')
    expect(csv).toContain('00:00,15')
    expect(csv).toContain('Phishing,45')
  })

  it('uses the supplied filename', () => {
    exportAnalyticsCsv(SAMPLE_DATA, 'custom-export.csv')
    const anchor = document.createElement.mock.results[0]?.value
    expect(anchor?.download).toBe('custom-export.csv')
  })
})
