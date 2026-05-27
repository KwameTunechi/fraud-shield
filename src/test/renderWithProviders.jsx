import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/**
 * Render a component wrapped in MemoryRouter.
 * @param {React.ReactElement} ui
 * @param {{ initialEntries?: string[], initialIndex?: number }} options
 */
export function renderWithRouter(ui, { initialEntries = ['/'], initialIndex = 0, ...renderOptions } = {}) {
  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        {children}
      </MemoryRouter>
    )
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

export { screen, waitFor, fireEvent, act } from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'
