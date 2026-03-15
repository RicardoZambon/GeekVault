import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { Sidebar, MobileSidebarContent } from "./sidebar"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({
    token: "mock-token",
    user: { displayName: "John Doe", email: "john@test.com" },
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}))

vi.mock("@/hooks", () => ({
  useMediaQuery: () => true, // default: desktop
}))

vi.mock("@/components/ds", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <span>{children}</span>,
}))

vi.mock("@/assets/logo-full.png", () => ({ default: "logo-full.png" }))
vi.mock("@/assets/vault-icon.png", () => ({ default: "vault-icon.png" }))

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("renders navigation items", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    expect(screen.getByText("nav.dashboard")).toBeInTheDocument()
    expect(screen.getByText("nav.collections")).toBeInTheDocument()
    expect(screen.getByText("nav.collectionTypes")).toBeInTheDocument()
    expect(screen.getByText("nav.wishlist")).toBeInTheDocument()
    expect(screen.getByText("nav.profile")).toBeInTheDocument()
  })

  it("renders user display name and initials", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("JD")).toBeInTheDocument()
  })

  it("renders full logo when expanded (desktop default)", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    const logo = screen.getByAltText("GeekVault")
    expect(logo).toHaveAttribute("src", "logo-full.png")
  })

  it("toggles collapsed state on toggle button click", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    const toggleBtn = screen.getByLabelText("nav.collapseSidebar")
    fireEvent.click(toggleBtn)
    // After collapse, the expand label should appear
    expect(screen.getByLabelText("nav.expandSidebar")).toBeInTheDocument()
  })

  it("persists collapsed state to localStorage", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    const toggleBtn = screen.getByLabelText("nav.collapseSidebar")
    fireEvent.click(toggleBtn)
    expect(localStorage.getItem("geekvault-sidebar-collapsed")).toBe("true")
  })

  it("reads collapsed state from localStorage", () => {
    localStorage.setItem("geekvault-sidebar-collapsed", "true")
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    expect(screen.getByLabelText("nav.expandSidebar")).toBeInTheDocument()
  })

  it("responds to toggle-sidebar custom event", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    // Initially expanded
    expect(screen.getByLabelText("nav.collapseSidebar")).toBeInTheDocument()
    act(() => {
      window.dispatchEvent(new Event("toggle-sidebar"))
    })
    expect(screen.getByLabelText("nav.expandSidebar")).toBeInTheDocument()
  })

  it("handles logout click", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText("nav.logout"))
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true })
  })

  it("renders collapsed sidebar with vault icon", () => {
    localStorage.setItem("geekvault-sidebar-collapsed", "true")
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    const logo = screen.getByAltText("GeekVault")
    expect(logo).toHaveAttribute("src", "vault-icon.png")
  })
})

describe("MobileSidebarContent", () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders all nav items", () => {
    render(
      <MemoryRouter>
        <MobileSidebarContent onClose={onClose} />
      </MemoryRouter>
    )
    expect(screen.getByText("nav.dashboard")).toBeInTheDocument()
    expect(screen.getByText("nav.collections")).toBeInTheDocument()
    expect(screen.getByText("nav.wishlist")).toBeInTheDocument()
  })

  it("renders user initials and display name", () => {
    render(
      <MemoryRouter>
        <MobileSidebarContent onClose={onClose} />
      </MemoryRouter>
    )
    expect(screen.getByText("JD")).toBeInTheDocument()
    expect(screen.getByText("John Doe")).toBeInTheDocument()
  })

  it("calls onClose and navigates on logout", () => {
    render(
      <MemoryRouter>
        <MobileSidebarContent onClose={onClose} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText("nav.logout"))
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true })
    expect(onClose).toHaveBeenCalled()
  })

  it("renders full logo", () => {
    render(
      <MemoryRouter>
        <MobileSidebarContent onClose={onClose} />
      </MemoryRouter>
    )
    const logo = screen.getByAltText("GeekVault")
    expect(logo).toHaveAttribute("src", "logo-full.png")
  })
})
