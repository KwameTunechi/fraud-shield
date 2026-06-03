# FraudShield — AI-Powered Mobile Money Fraud Detection Platform

A research project investigating the effectiveness of AI, blockchain, and multi-factor authentication (MFA) in combating fraud in Ghana's mobile money ecosystem (with a focus on Telecel Cash). The platform consists of two parts: a **web admin dashboard** for fraud analysts, and a **mobile simulation app** for demonstrating the user-side fraud-prevention experience.

---

## Background

Mobile money in Ghana has significantly improved financial inclusion, but fraud — SIM swaps, phishing, fake reversals, account takeovers — has surged, with losses reported at **GH₵14.94M in early 2025 alone**. This platform simulates how layered defences (AI risk scoring, blockchain audit trails, and MFA) can detect and prevent these attacks in real time.

---

## Repository Structure

```
fraud-shield/
├── src/                        # Web admin dashboard (React + Vite)
│   ├── pages/                  # Route-level page components
│   ├── components/             # Shared UI components (Sidebar, Layout, ErrorBoundary)
│   ├── errors/                 # Domain-specific error class hierarchy
│   ├── schemas/                # Zod validation schemas
│   ├── utils/                  # Pure utilities (logger, async helpers, formatters)
│   └── test/                   # Test setup, factories, render helpers
├── mobile/                     # Mobile simulation app (React Native + Expo)
│   └── src/
│       ├── screens/            # Auth and main app screens
│       ├── navigation/         # Stack and tab navigators
│       ├── data/               # Mock transaction and user data
│       └── utils/              # Fraud scenario simulator
├── .github/workflows/ci.yml    # CI/CD pipeline (lint → test → build)
└── coverage/                   # Generated coverage reports (gitignored)
```

---

## Web Admin Dashboard

Built with **React 19**, **Vite 8**, and **Tailwind CSS 4**.

### Features

| Page | Description |
|---|---|
| Landing Page | Public marketing page with platform overview |
| Sign In | Organisation login with password visibility toggle and forgot-password flow |
| Two-Factor Auth | OTP verification step after sign-in |
| Dashboard | KPI overview — total transactions, risk score, blocked attempts, active alerts |
| Live Transactions | Real-time transaction stream with per-row AI risk scores and status badges |
| Risk Analytics | Anomaly detection chart, threat-category pie chart, 7-day risk trend, CSV export |
| Blockchain Ledger | Immutable audit trail of flagged and confirmed transactions |
| Customer Directory | Searchable list of registered users with trust scores and MFA status |
| Alerts & Incidents | Active fraud alerts with severity levels and resolution workflow |
| AI Configuration | Threshold tuning for risk model parameters |
| Administrators | Admin user management |
| System Settings | Platform-wide configuration |

### Tech Stack

- **React 19** — UI framework
- **Vite 8** — build tool with HMR
- **Tailwind CSS 4** — utility-first styling
- **React Router v7** — client-side routing
- **Recharts 3** — charting (area, line, pie)
- **Lucide React** — icon library
- **Zod 4** — runtime schema validation at system boundaries

---

## Mobile Simulation App

Built with **React Native** and **Expo SDK 56**. Runnable on iOS, Android, or web via `npx expo start`.

### Screens & Flows

**Authentication**
- Splash screen with animated brand entry
- Sign-in with email/password
- OTP verification (6-digit code)
- Biometric authentication (fingerprint / Face ID via `expo-local-authentication`)

**Main App (Bottom Tabs)**
- **Home** — wallet balance, quick-action buttons, recent transactions, live AI risk indicator
- **Send Money** — 5-step flow: recipient → amount → AI risk check → MFA → confirmation. The AI risk check simulates real-time scoring and blocks or flags high-risk transfers
- **Transactions** — filterable history with status badges (Safe / Review / Blocked)
- **Transaction Detail** — blockchain audit entry for each transaction
- **Security** — fraud scenario simulator (SIM swap, phishing, fake reversal, account takeover) with step-by-step attack/defence walkthrough
- **Profile** — account settings, MFA toggle, security level indicator

### Tech Stack

- **React Native** + **Expo SDK 56**
- **React Navigation** (native-stack + bottom-tabs)
- **expo-local-authentication** — biometric auth
- **expo-linear-gradient** — UI gradients

### Running the Mobile App

```bash
cd mobile
npm install
npx expo start --web      # browser (fastest for development)
npx expo start            # QR code for Expo Go on device
```

---

## Testing

The web app has a production-grade testing setup targeting **≥ 80% coverage** across all metrics.

### Current Coverage

| Metric | Coverage |
|---|---|
| Statements | **96.38%** |
| Branches | **89.75%** |
| Functions | **93.33%** |
| Lines | **96.59%** |

### Test Commands

```bash
npm test                  # run all tests once
npm run test:watch        # interactive watch mode
npm run test:coverage     # run with v8 coverage report
npm run test:ui           # Vitest browser UI
```

### Architecture

**Test infrastructure** (`src/test/`)
- `setup.js` — global jest-dom matchers, ResizeObserver stub, URL.createObjectURL mock
- `factories.js` — test data factories with auto-incrementing IDs (buildTransaction, buildCustomer, buildAlert, etc.)
- `renderWithProviders.jsx` — `renderWithRouter()` helper wrapping MemoryRouter

**Domain error hierarchy** (`src/errors/index.js`)
```
AppError
├── ValidationError   — field-level Zod issues
├── NetworkError      — HTTP failures with retryable flag
├── AuthError         — authentication/authorisation failures
├── FraudDetectionError — risk scoring results
└── BlockchainError   — ledger write/read errors
```

**Structured logger** (`src/utils/logger.js`) — sanitises sensitive fields (password, token, secret, pin, otp) before any output. Exposes `info`, `warn`, `error`, `logError`, and `logApiCall`.

**Async resilience utilities** (`src/utils/async.js`)
- `withTimeout(promise, ms)` — rejects with `NetworkError` after timeout
- `withRetry(fn, opts)` — exponential backoff with configurable `shouldRetry` predicate
- `createCircuitBreaker(opts)` — open/closed circuit with auto-reset

**Zod schemas** (`src/schemas/index.js`) — `TransactionSchema`, `CustomerSchema`, `SignInSchema`, `OtpSchema`, `AlertSchema` with Ghana phone number regex and typed enums.

### Test Patterns Used

- **AAA** (Arrange / Act / Assert) structure throughout
- `userEvent` for realistic interaction (typing, clicking)
- `fireEvent` for synchronous events in fake-timer contexts
- `vi.useFakeTimers()` + `await act(() => vi.advanceTimersByTime(n))` for timer-dependent behaviour
- Recharts mocked in jsdom to avoid SVG/ResizeObserver errors
- `vi.spyOn(HTMLAnchorElement.prototype, 'click')` for CSV download tests

---

## CI/CD Pipeline

GitHub Actions runs three jobs on every push to `main`/`develop` and every PR targeting `main`:

```
lint ──┐
       ├──► build
test ──┘
```

| Job | What it does |
|---|---|
| **Lint** | `eslint src --max-warnings 0` — zero lint warnings allowed |
| **Test** | `vitest run --coverage` — fails if any threshold < 80%; uploads coverage report as artifact; posts summary comment on PRs |
| **Build** | `npm run build` — fails if bundle exceeds **2 MB**; uploads `dist/` as artifact |

---

## Getting Started (Web)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Production build
npm run build
```

---

## Research Context

This platform was developed as part of an academic research project at the **University of Ghana** investigating how composite security layers (AI anomaly detection + blockchain immutability + MFA friction) reduce fraud rates in the Ghanaian mobile money sector compared to single-layer defences. The mobile simulation app is used to demonstrate attack scenarios and corresponding system responses in user studies.

---

## Team

| Name | Role | GitHub |
|---|---|---|
| Evans Adusu | Project Lead / Web & Mobile | [@KwameTunechi](https://github.com/KwameTunechi) |

> **Sprint 0 task for every team member:** fork this repo, create a branch `docs/yourname-add-to-team`, add your row to this table, open a pull request, and ask a teammate to review it. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the branching strategy, PR etiquette, and commit conventions used by this team.
