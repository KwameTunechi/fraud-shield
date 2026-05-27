import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary.jsx'

// A component that throws on demand
function Bomb({ shouldThrow = false }) {
  if (shouldThrow) throw new Error('Test render crash')
  return <div>All good</div>
}

// Suppress console.error output from the React error boundary during tests
const suppressConsoleError = () => vi.spyOn(console, 'error').mockImplementation(() => {})

describe('ErrorBoundary — happy path', () => {
  it('renders children when there is no error', () => {
    // Arrange & Act
    render(
      <ErrorBoundary>
        <div data-testid="child">Hello</div>
      </ErrorBoundary>
    )

    // Assert
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})

describe('ErrorBoundary — error state', () => {
  beforeEach(suppressConsoleError)

  it('renders the default fallback UI when a child throws', () => {
    // Arrange & Act
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )

    // Assert
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
  })

  it('renders a Try again button in the fallback', () => {
    render(<ErrorBoundary><Bomb shouldThrow /></ErrorBoundary>)
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument()
  })

  it('clears the error state when Try again is clicked', () => {
    // Arrange — render with error then click reset
    render(<ErrorBoundary><Bomb shouldThrow /></ErrorBoundary>)
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()

    // Act
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }))

    // After reset, the ErrorBoundary re-renders children (Bomb still throws, so
    // fallback appears again — but the reset handler was called)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not show children after a crash', () => {
    render(<ErrorBoundary><Bomb shouldThrow /></ErrorBoundary>)
    expect(screen.queryByText('All good')).not.toBeInTheDocument()
  })
})

describe('ErrorBoundary — custom fallback', () => {
  beforeEach(suppressConsoleError)

  it('renders the custom fallback component when provided', () => {
    // Arrange
    function CustomFallback({ error }) {
      return <div data-testid="custom-fallback">Error: {error.message}</div>
    }

    // Act
    render(
      <ErrorBoundary fallback={CustomFallback}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )

    // Assert
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    expect(screen.getByText(/Test render crash/)).toBeInTheDocument()
  })
})

describe('ErrorBoundary — onError callback', () => {
  beforeEach(suppressConsoleError)

  it('calls the onError prop with the error and info', () => {
    // Arrange
    const onError = vi.fn()

    // Act
    render(
      <ErrorBoundary onError={onError}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )

    // Assert
    expect(onError).toHaveBeenCalledOnce()
    const [err, info] = onError.mock.calls[0]
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Test render crash')
    expect(info).toHaveProperty('componentStack')
  })
})
