import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from './Dashboard'

// Mock the API client
vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
  },
}))

// Mock the auth context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    admin: { id: '1', email: 'admin@test.com', fullName: 'Test Admin', role: 'analyst' },
    loading: false,
  }),
}))

import { api } from '../api/client'

const TestWrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {})) // Never resolves
    render(<Dashboard />, { wrapper: TestWrapper })
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders summary numbers when API resolves', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/api/risk/summary') {
        return Promise.resolve({
          transactionsLast24h: 142,
          blockedLast24h: 7,
          openAlerts: 3,
          averageRisk: 32,
        })
      }
      if (path === '/api/transactions?limit=4') {
        return Promise.resolve({ transactions: [] })
      }
      if (path.includes('/api/alerts')) {
        return Promise.resolve({ alerts: [] })
      }
      return Promise.resolve({})
    })

    render(<Dashboard />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText('142')).toBeInTheDocument()
    })

    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows error state when API rejects', async () => {
    api.get.mockRejectedValue(new Error('Network error'))

    render(<Dashboard />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
    })
  })

  it('fetches data from correct endpoints', async () => {
    api.get.mockResolvedValue({
      transactionsLast24h: 0,
      blockedLast24h: 0,
      openAlerts: 0,
      averageRisk: 0,
    })

    render(<Dashboard />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/risk/summary')
    })
  })
})
