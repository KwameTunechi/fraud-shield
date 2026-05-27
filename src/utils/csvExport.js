// ---------------------------------------------------------------------------
// CSV export logic extracted from RiskAnalytics — pure and independently
// testable. The browser-side download side-effect is isolated in triggerDownload.
// ---------------------------------------------------------------------------

/** Converts a 2D array of rows into a CSV string. */
export function rowsToCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '')
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        })
        .join(',')
    )
    .join('\n')
}

/** Builds the analytics CSV rows from the chart data arrays. */
export function buildAnalyticsCsvRows({ anomalyData, trendData, threatCategories }) {
  return [
    ['Anomaly Detection Score'],
    ['Time', 'Score'],
    ...anomalyData.map((d) => [d.time, d.score]),
    [],
    ['7-Day Risk Trend'],
    ['Day', 'Risk'],
    ...trendData.map((d) => [d.day, d.risk]),
    [],
    ['Threats by Category'],
    ['Category', 'Count'],
    ...threatCategories.map((d) => [d.name, d.value]),
  ]
}

/**
 * Triggers a browser file download for the given CSV string.
 * Isolated here so unit tests can assert on the data without a real DOM.
 */
export function triggerCsvDownload(csvString, filename = 'export.csv') {
  const blob = new Blob([csvString], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** End-to-end helper used by RiskAnalytics — builds rows, converts, downloads. */
export function exportAnalyticsCsv(data, filename = 'fraudshield-risk-analytics.csv') {
  const rows = buildAnalyticsCsvRows(data)
  const csv = rowsToCsv(rows)
  triggerCsvDownload(csv, filename)
  return csv
}
