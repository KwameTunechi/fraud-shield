import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Suppress ResizeObserver errors from Recharts in jsdom
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Suppress SVGElement methods missing in jsdom
global.SVGElement = global.SVGElement || class {}

// Stub URL.createObjectURL / revokeObjectURL used by CSV export
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Stub document.createElement click used by CSV download
const originalCreateElement = document.createElement.bind(document)
vi.spyOn(document, 'createElement').mockImplementation((tag) => {
  const el = originalCreateElement(tag)
  if (tag === 'a') el.click = vi.fn()
  return el
})

afterEach(() => {
  vi.clearAllMocks()
})
