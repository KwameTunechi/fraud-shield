import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, within, act } from '@testing-library/react'
import { renderWithRouter } from '../test/renderWithProviders.jsx'
import LiveTransactions from './LiveTransactions.jsx'

// DashboardLayout pulls in Sidebar which uses useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

// Recharts uses ResizeObserver & SVG methods — stubbed in setup.js
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => children,
  AreaChart: () => null, LineChart: () => null, PieChart: () => null,
  Area: () => null, Line: () => null, Pie: () => null, Cell: () => null,
  XAxis: () => null, YAxis: () => null, CartesianGrid: () => null, Tooltip: () => null,
}))

function setup() {
  renderWithRouter(<LiveTransactions />)
}

describe('LiveTransactions page — structure', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('renders the Live Transactions Monitoring heading', () => {
    setup()
    expect(screen.getByText(/Live Transactions Monitoring/i)).toBeInTheDocument()
  })

  it('renders the LIVE indicator badge', () => {
    setup()
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })

  it('renders four summary stat cards', () => {
    setup()
    expect(screen.getByText('Total Transactions')).toBeInTheDocument()
    expect(screen.getByText('Safe Transactions')).toBeInTheDocument()
    expect(screen.getByText('Under Review')).toBeInTheDocument()
    expect(screen.getAllByText('Blocked').length).toBeGreaterThan(0)
  })

  it('renders the Transaction Stream table', () => {
    setup()
    expect(screen.getByText('Transaction Stream')).toBeInTheDocument()
  })
})

describe('LiveTransactions page — transaction table data', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('renders all 8 transaction rows', () => {
    setup()
    // IDs are unique — assert first and last
    expect(screen.getByText('TXN-2024-001')).toBeInTheDocument()
    expect(screen.getByText('TXN-2024-008')).toBeInTheDocument()
  })

  it('renders customer names in the table', () => {
    setup()
    expect(screen.getByText('Kwame Mensah')).toBeInTheDocument()
    expect(screen.getByText('Akosua Appiah')).toBeInTheDocument()
  })

  it('renders risk scores in the table', () => {
    setup()
    // Transaction with 87% risk (Yaw Agyeman)
    expect(screen.getByText('87%')).toBeInTheDocument()
  })

  it('renders status badges for Safe, Review, and Blocked', () => {
    setup()
    const allSafe = screen.getAllByText('Safe')
    const allReview = screen.getAllByText('Review')
    const allBlocked = screen.getAllByText('Blocked')

    expect(allSafe.length).toBeGreaterThan(0)
    expect(allReview.length).toBeGreaterThan(0)
    expect(allBlocked.length).toBeGreaterThan(0)
  })

  it('renders both AGENT and CUSTOMER category labels', () => {
    setup()
    expect(screen.getAllByText('AGENT').length).toBeGreaterThan(0)
    expect(screen.getAllByText('CUSTOMER').length).toBeGreaterThan(0)
  })
})

describe('LiveTransactions page — live clock', () => {
  it('displays a formatted time string (HH:MM:SS)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-27T14:23:45'))
    setup()
    // TXN-2024-001 also shows '14:23:45' in the table, so multiple elements match
    expect(screen.getAllByText('14:23:45').length).toBeGreaterThan(0)
    vi.useRealTimers()
  })

  it('updates the clock every second', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-27T14:23:45'))
    setup()

    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(screen.getByText('14:23:46')).toBeInTheDocument()
    vi.useRealTimers()
  })
})

describe('LiveTransactions page — navigation', () => {
  it('navigates back to dashboard when Back button is clicked', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: /Back to Dashboard/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })
})
