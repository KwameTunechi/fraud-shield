import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../test/renderWithProviders.jsx'
import SignIn from './SignIn.jsx'

// Mock react-router-dom navigate so we can assert on navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

function setup() {
  const user = userEvent.setup()
  renderWithRouter(<SignIn />)
  return { user }
}

describe('SignIn page — initial render', () => {
  it('displays the FraudShield brand name', () => {
    setup()
    expect(screen.getByText('FraudShield')).toBeInTheDocument()
  })

  it('renders the Organization Login heading', () => {
    setup()
    expect(screen.getByRole('heading', { name: /Organization Login/i })).toBeInTheDocument()
  })

  it('renders email and password inputs', () => {
    setup()
    expect(screen.getByPlaceholderText(/admin@organization.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('renders a Sign In submit button', () => {
    setup()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })
})

describe('SignIn page — password visibility toggle', () => {
  it('password field is masked by default', () => {
    setup()
    const input = screen.getByPlaceholderText('••••••••')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('clicking the eye button reveals the password', async () => {
    const { user } = setup()
    const toggle = screen.getByRole('button', { name: '' }) // eye icon button
    await user.click(toggle)
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'text')
  })

  it('clicking the eye button a second time re-masks the password', async () => {
    const { user } = setup()
    const toggle = screen.getAllByRole('button').find((b) => b.type === 'button' && !b.textContent.includes('Sign'))
    await user.click(toggle)
    await user.click(toggle)
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password')
  })
})

describe('SignIn page — form submission', () => {
  it('navigates to /verify on valid form submission', async () => {
    const { user } = setup()

    await user.type(screen.getByPlaceholderText(/admin@organization.com/i), 'admin@org.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /Sign In/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/verify')
  })
})

describe('SignIn page — forgot password', () => {
  afterEach(() => { vi.useRealTimers() })

  it('shows a reset confirmation message after clicking Forgot password', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: /Forgot password/i }))

    expect(await screen.findByText(/Reset link sent/i)).toBeInTheDocument()
  })

  it('reverts to Forgot password text after 3 seconds', async () => {
    vi.useFakeTimers()
    setup()

    // fireEvent is synchronous — no timer interaction, no hang with fake timers
    fireEvent.click(screen.getByRole('button', { name: /Forgot password/i }))
    expect(screen.getByText(/Reset link sent/i)).toBeInTheDocument()

    // Advance fake clock then await act() to flush the resulting state update
    await act(() => vi.advanceTimersByTime(3100))
    expect(screen.getByRole('button', { name: /Forgot password/i })).toBeInTheDocument()
  })
})

describe('SignIn page — form field updates', () => {
  it('updates the email field as the user types', async () => {
    const { user } = setup()
    const emailInput = screen.getByPlaceholderText(/admin@organization.com/i)
    await user.type(emailInput, 'test@example.com')
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('updates the password field as the user types', async () => {
    const { user } = setup()
    const passwordInput = screen.getByPlaceholderText('••••••••')
    await user.type(passwordInput, 'mypassword')
    expect(passwordInput).toHaveValue('mypassword')
  })
})
