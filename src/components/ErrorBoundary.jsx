import { Component } from 'react'
import logger from '../utils/logger.js'

// ---------------------------------------------------------------------------
// ErrorBoundary — catches render-phase errors and shows a fallback UI.
// Logs structured error details so issues are traceable in production.
// ---------------------------------------------------------------------------

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    logger.error('Uncaught render error', {
      errorName: error.name,
      errorMessage: error.message,
      componentStack: info.componentStack,
    })
    this.props.onError?.(error, info)
  }

  handleReset() {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const FallbackComponent = this.props.fallback
    if (FallbackComponent) {
      return (
        <FallbackComponent
          error={this.state.error}
          onReset={() => this.handleReset()}
        />
      )
    }

    return <DefaultFallback error={this.state.error} onReset={() => this.handleReset()} />
  }
}

function DefaultFallback({ error, onReset }) {
  const isDev = import.meta.env?.DEV

  return (
    <div
      role="alert"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '32px',
        textAlign: 'center',
        gap: '16px',
      }}
    >
      <div style={{ fontSize: '48px' }}>🛡️</div>
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', margin: 0, lineHeight: '1.6' }}>
        FraudShield encountered an unexpected error. Your data is safe. Please try refreshing.
      </p>
      {isDev && error && (
        <pre
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '12px',
            color: '#dc2626',
            textAlign: 'left',
            maxWidth: '600px',
            overflowX: 'auto',
          }}
        >
          {error.message}
        </pre>
      )}
      <button
        onClick={onReset}
        style={{
          padding: '12px 28px',
          background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}
