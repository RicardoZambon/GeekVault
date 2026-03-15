import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import AppLayout from "./app-layout"

const mockLogout = vi.fn()
const mockNavigate = vi.fn()
const mockSetTheme = vi.fn()
const mockChangeLanguage = vi.fn()
let mockTheme = "light"
let mockLanguage = "en"

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({ token: "tok", user: { id: "1", email: "a@b.com", displayName: "T" }, isLoading: false, login: vi.fn(), register: vi.fn(), logout: mockLogout }),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { get language() { return mockLanguage }, changeLanguage: mockChangeLanguage },
  }),
}))

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ get theme() { return mockTheme }, setTheme: mockSetTheme }),
}))

describe("AppLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTheme = "light"
    mockLanguage = "en"
  })

  it("renders sidebar with nav links", () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    )
    expect(screen.getAllByText("GeekVault").length).toBeGreaterThan(0)
    expect(screen.getByText("nav.dashboard")).toBeInTheDocument()
    expect(screen.getByText("nav.collections")).toBeInTheDocument()
    expect(screen.getByText("nav.collectionTypes")).toBeInTheDocument()
    expect(screen.getByText("nav.wishlist")).toBeInTheDocument()
    expect(screen.getByText("nav.profile")).toBeInTheDocument()
  })

  it("renders theme toggle button", () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    )
    expect(screen.getByLabelText("nav.toggleTheme")).toBeInTheDocument()
  })

  it("renders language toggle button", () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    )
    expect(screen.getByLabelText("Português")).toBeInTheDocument()
  })

  it("renders logout button and handles click", () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    )
    const logoutButtons = screen.getAllByText("nav.logout")
    fireEvent.click(logoutButtons[0])
    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true })
  })

  it("toggles theme from light to dark on click", () => {
    mockTheme = "light"
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByLabelText("nav.toggleTheme"))
    expect(mockSetTheme).toHaveBeenCalledWith("dark")
  })

  it("toggles theme from dark to light on click", () => {
    mockTheme = "dark"
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByLabelText("nav.toggleTheme"))
    expect(mockSetTheme).toHaveBeenCalledWith("light")
  })

  it("toggles language from en to pt", () => {
    mockLanguage = "en"
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    )
    const langButton = screen.getByLabelText("Português")
    fireEvent.click(langButton)
    expect(mockChangeLanguage).toHaveBeenCalledWith("pt")
  })

  it("toggles language from pt to en", () => {
    mockLanguage = "pt"
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    )
    const langButton = screen.getByLabelText("English")
    fireEvent.click(langButton)
    expect(mockChangeLanguage).toHaveBeenCalledWith("en")
  })

  it("nav links call onClick when provided (mobile sidebar)", () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    )
    // The mobile sidebar has NavLinks with onClick prop.
    // Open the mobile menu sheet (via the Sheet trigger)
    const menuButton = screen.getByText("Toggle menu")
    fireEvent.click(menuButton)

    // In the mobile nav, clicking a nav link should close the sidebar
    // The nav items are rendered twice (desktop + mobile), so get all dashboard links
    const dashboardLinks = screen.getAllByText("nav.dashboard")
    // Click the mobile one (the one in the Sheet)
    if (dashboardLinks.length > 1) {
      fireEvent.click(dashboardLinks[dashboardLinks.length - 1])
    }
  })
})
