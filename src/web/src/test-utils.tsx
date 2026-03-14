import { render, type RenderOptions } from "@testing-library/react"
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom"
import { type ReactElement, type ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"

// Mock auth context value
export const mockAuth = {
  user: { id: "1", email: "test@example.com", displayName: "Test User" },
  token: "mock-token",
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}

// Mock auth with no token
export const mockAuthLoggedOut = {
  ...mockAuth,
  user: null,
  token: null,
}

interface WrapperOptions {
  routerProps?: MemoryRouterProps
}

function createWrapper(options: WrapperOptions = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter {...options.routerProps}>
        <ThemeProvider defaultTheme="light" storageKey="test-theme">
          {children}
        </ThemeProvider>
      </MemoryRouter>
    )
  }
}

export function renderWithProviders(
  ui: ReactElement,
  options?: WrapperOptions & Omit<RenderOptions, "wrapper">
) {
  const { routerProps, ...renderOptions } = options ?? {}
  return render(ui, {
    wrapper: createWrapper({ routerProps }),
    ...renderOptions,
  })
}

// Helper to create a successful fetch mock response
export function mockFetchResponse(data: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
    blob: () => Promise.resolve(new Blob()),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response)
}

// Helper to create a failed fetch response
export function mockFetchError(message = "Failed") {
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({ message }),
  } as Response)
}
