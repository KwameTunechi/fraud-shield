// ---------------------------------------------------------------------------
// Domain-specific error hierarchy for FraudShield.
// Prefer these over generic Error so catch blocks can branch by type.
// ---------------------------------------------------------------------------

export class AppError extends Error {
  constructor(message, { code = 'APP_ERROR', context = {} } = {}) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.context = context
    this.timestamp = new Date().toISOString()
    if (Error.captureStackTrace) Error.captureStackTrace(this, new.target)
  }

  toJSON() {
    return { name: this.name, code: this.code, message: this.message, context: this.context, timestamp: this.timestamp }
  }
}

export class ValidationError extends AppError {
  constructor(message, { field = null, value = undefined, issues = [] } = {}) {
    super(message, { code: 'VALIDATION_ERROR', context: { field, value, issues } })
    this.name = 'ValidationError'
    this.field = field
    this.issues = issues
  }
}

export class NetworkError extends AppError {
  constructor(message, { statusCode = null, endpoint = null, retryable = true } = {}) {
    super(message, { code: 'NETWORK_ERROR', context: { statusCode, endpoint } })
    this.name = 'NetworkError'
    this.statusCode = statusCode
    this.endpoint = endpoint
    this.retryable = retryable
  }
}

export class AuthError extends AppError {
  constructor(message, { reason = 'UNKNOWN' } = {}) {
    super(message, { code: 'AUTH_ERROR', context: { reason } })
    this.name = 'AuthError'
    this.reason = reason
  }
}

export class FraudDetectionError extends AppError {
  constructor(message, { transactionId = null, riskScore = null } = {}) {
    super(message, { code: 'FRAUD_DETECTION_ERROR', context: { transactionId, riskScore } })
    this.name = 'FraudDetectionError'
    this.transactionId = transactionId
    this.riskScore = riskScore
  }
}

export class BlockchainError extends AppError {
  constructor(message, { blockHash = null, operation = null } = {}) {
    super(message, { code: 'BLOCKCHAIN_ERROR', context: { blockHash, operation } })
    this.name = 'BlockchainError'
    this.blockHash = blockHash
    this.operation = operation
  }
}

/** Returns true if the error is safe to retry (transient). */
export function isRetryable(error) {
  if (error instanceof NetworkError) return error.retryable
  if (error instanceof ValidationError) return false
  if (error instanceof AuthError) return false
  return false
}

/** Returns a user-safe message without leaking internals. */
export function toUserMessage(error) {
  if (error instanceof ValidationError) return error.message
  if (error instanceof AuthError) return 'Authentication failed. Please sign in again.'
  if (error instanceof NetworkError) return 'A network error occurred. Please try again.'
  if (error instanceof FraudDetectionError) return 'Transaction could not be processed. Please contact support.'
  if (error instanceof BlockchainError) return 'Ledger verification failed. Please try again later.'
  return 'An unexpected error occurred. Please try again.'
}
