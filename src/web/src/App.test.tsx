import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import App from "./App"

// We need to mock the auth provider and all the pages to isolate App routing logic
vi.mock("./components/auth-provider", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}))

// Mock all page components to simplify
vi.mock("./pages/Dashboard", () => ({ default: () => <div>Dashboard Page</div> }))
vi.mock("./pages/Collections", () => ({ default: () => <div>Collections Page</div> }))
vi.mock("./pages/CollectionDetail", () => ({ default: () => <div>Collection Detail Page</div> }))
vi.mock("./pages/CatalogItemDetail", () => ({ default: () => <div>Catalog Item Page</div> }))
vi.mock("./pages/CollectionTypes", () => ({ default: () => <div>Collection Types Page</div> }))
vi.mock("./pages/Wishlist", () => ({ default: () => <div>Wishlist Page</div> }))
vi.mock("./pages/Profile", () => ({ default: () => <div>Profile Page</div> }))
vi.mock("./pages/Login", () => ({ default: () => <div>Login Page</div> }))
vi.mock("./pages/Register", () => ({ default: () => <div>Register Page</div> }))
vi.mock("./components/app-layout", () => ({
  default: () => {
    const { Outlet } = require("react-router-dom")
    return <div>Layout<Outlet /></div>
  },
}))

import { useAuth } from "./components/auth-provider"
const mockUseAuth = vi.mocked(useAuth)

describe("App routing", () => {
  it("shows loading spinner when auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, token: null, isLoading: true, login: vi.fn(), register: vi.fn(), logout: vi.fn() })
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    )
    expect(document.querySelector(".animate-spin")).toBeInTheDocument()
  })

  it("redirects to login when not authenticated", async () => {
    mockUseAuth.mockReturnValue({ user: null, token: null, isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() })
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument()
    })
  })

  it("shows dashboard when authenticated", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "1", email: "a@b.com", displayName: "T" }, token: "tok", isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() })
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText("Dashboard Page")).toBeInTheDocument()
    })
  })

  it("redirects to home when authenticated user visits login", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "1", email: "a@b.com", displayName: "T" }, token: "tok", isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() })
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText("Dashboard Page")).toBeInTheDocument()
    })
  })

  it("shows register page for guests", async () => {
    mockUseAuth.mockReturnValue({ user: null, token: null, isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() })
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <App />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText("Register Page")).toBeInTheDocument()
    })
  })

  it("shows login page for guests", async () => {
    mockUseAuth.mockReturnValue({ user: null, token: null, isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() })
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument()
    })
  })

  it("shows collections page for authenticated users", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "1", email: "a@b.com", displayName: "T" }, token: "tok", isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() })
    render(
      <MemoryRouter initialEntries={["/collections"]}>
        <App />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText("Collections Page")).toBeInTheDocument()
    })
  })

  it("shows loading for guest routes while loading", () => {
    mockUseAuth.mockReturnValue({ user: null, token: null, isLoading: true, login: vi.fn(), register: vi.fn(), logout: vi.fn() })
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    )
    expect(document.querySelector(".animate-spin")).toBeInTheDocument()
  })
})
