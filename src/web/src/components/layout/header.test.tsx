import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { Header } from "./header"

const mockSetTheme = vi.fn()
const mockChangeLanguage = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => vi.fn() }
})

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({
    token: "mock-token",
    user: { displayName: "Jane", email: "jane@test.com" },
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: mockChangeLanguage },
  }),
}))

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ theme: "light", setTheme: mockSetTheme }),
}))

vi.mock("@/assets/vault-icon.png", () => ({ default: "vault-icon.png" }))

// Mock sidebar to avoid rendering full sidebar deps
vi.mock("./sidebar", () => ({
  MobileSidebarContent: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="mobile-sidebar" onClick={onClose}>
      Mobile Sidebar
    </div>
  ),
}))

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders GeekVault brand", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    expect(screen.getByText("GeekVault")).toBeInTheDocument()
    expect(screen.getByAltText("GeekVault")).toHaveAttribute("src", "vault-icon.png")
  })

  it("renders toggle menu button", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    expect(screen.getByText("nav.toggleMenu")).toBeInTheDocument()
  })

  it("renders theme toggle button", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    expect(screen.getByLabelText("nav.toggleTheme")).toBeInTheDocument()
  })

  it("toggles theme on click", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByLabelText("nav.toggleTheme"))
    expect(mockSetTheme).toHaveBeenCalledWith("dark")
  })

  it("renders language toggle button", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    expect(screen.getByLabelText("Português")).toBeInTheDocument()
  })

  it("toggles language on click", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByLabelText("Português"))
    expect(mockChangeLanguage).toHaveBeenCalledWith("pt")
  })

})
