// ---------------------------------------------------------------------------
// Test data factories — build minimal valid objects, let callers override.
// ---------------------------------------------------------------------------

let seq = 0
const nextId = (prefix) => `${prefix}-${String(++seq).padStart(4, '0')}`

export function buildTransaction(overrides = {}) {
  return {
    id: nextId('TXN'),
    time: '14:23:45',
    customer: 'Kwame Mensah',
    phone: '+233 24 567 8901',
    amount: '₵1,250.00',
    location: 'Accra, Ghana',
    risk: 12,
    status: 'Safe',
    category: 'CUSTOMER',
    ...overrides,
  }
}

export function buildHighRiskTransaction(overrides = {}) {
  return buildTransaction({ risk: 87, status: 'Blocked', location: 'New York, USA', ...overrides })
}

export function buildReviewTransaction(overrides = {}) {
  return buildTransaction({ risk: 45, status: 'Review', location: 'London, UK', ...overrides })
}

export function buildCustomer(overrides = {}) {
  return {
    id: nextId('CUST'),
    name: 'Ama Asante',
    phone: '+233 20 345 6789',
    role: 'CUSTOMER',
    trustScore: 94,
    mfaEnabled: true,
    verified: true,
    ...overrides,
  }
}

export function buildAlert(overrides = {}) {
  return {
    id: nextId('ALT'),
    title: 'Unusual Login Location',
    description: 'Login attempt detected from Dubai, UAE',
    severity: 'warning',
    timestamp: new Date('2026-05-27T14:23:00').toISOString(),
    read: false,
    ...overrides,
  }
}

export function buildAuthForm(overrides = {}) {
  return {
    email: 'admin@fraudshield.com',
    password: 'SecurePass123!',
    ...overrides,
  }
}

export function buildAnomalyDataPoint(overrides = {}) {
  return { time: '12:00', score: 46, ...overrides }
}

export function buildThreatCategory(overrides = {}) {
  return { name: 'Phishing', value: 45, color: '#6366f1', ...overrides }
}

// Reset sequence between tests if needed
export function resetFactorySequence() { seq = 0 }
