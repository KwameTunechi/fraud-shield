import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../test/renderWithProviders.jsx'
import RiskAnalytics from './RiskAnalytics.jsx'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => children,
  AreaChart: () => null, LineChart: () => null, PieChart: () => null,
  Area: () => null, Line: () => null, Pie: () => null, Cell: () => null,
  XAxis: () => null, YAxis: () => null, CartesianGrid: () => null, Tooltip: () => null,
}))

function setup() {
  const user = userEvent.setup()
  renderWithRouter(<RiskAnalytics />)
  return { user }
}

describe('RiskAnalytics page — structure', () => {
  it('renders the Risk Analytics heading', () => {
    setup()
    expect(screen.getByRole('heading', { level: 1, name: /Risk Analytics/i })).toBeInTheDocument()
  })

  it('renders the four summary stat cards', () => {
    setup()
    expect(screen.getByText('Current Risk')).toBeInTheDocument()
    expect(screen.getByText('Threats Blocked')).toBeInTheDocument()
    expect(screen.getByText('Protected Assets')).toBeInTheDocument()
    expect(screen.getByText('Detection Rate')).toBeInTheDocument()
  })

  it('renders the stat card values', () => {
    setup()
    expect(screen.getByText('Low')).toBeInTheDocument()      // Current Risk value
    expect(screen.getByText('32')).toBeInTheDocument()        // Threats Blocked
    expect(screen.getByText('98.5%')).toBeInTheDocument()    // Detection Rate
  })

  it('renders the chart section headings', () => {
    setup()
    expect(screen.getByText('Anomaly Detection Score')).toBeInTheDocument()
    expect(screen.getByText('Threats by Category')).toBeInTheDocument()
    expect(screen.getByText('7-Day Risk Trend')).toBeInTheDocument()
  })

  it('renders threat category legend items', () => {
    setup()
    expect(screen.getByText(/Phishing/)).toBeInTheDocument()
    expect(screen.getByText(/Account Takeover/)).toBeInTheDocument()
    expect(screen.getByText(/Transaction Fraud/)).toBeInTheDocument()
    expect(screen.getByText(/Identity Theft/)).toBeInTheDocument()
  })
})

describe('RiskAnalytics page — CSV export', () => {
  beforeEach(() => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders an Export to Excel button', () => {
    setup()
    expect(screen.getByRole('button', { name: /Export to Excel/i })).toBeInTheDocument()
  })

  it('triggers a CSV download when the Export button is clicked', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /Export to Excel/i }))
    expect(URL.createObjectURL).toHaveBeenCalled()
  })
})

describe('RiskAnalytics page — navigation', () => {
  it('navigates back to dashboard when Back is clicked', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /Back/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })
})
