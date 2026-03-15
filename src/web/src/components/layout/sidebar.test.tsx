import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { Sidebar, MobileSidebarContent } from "./sidebar"

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => vi.fn() }
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
  DropdownMenu: ({ children }: any) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
}))

vi.mock("./user-menu", () => ({
  UserMenu: ({ children }: any) => <>{children}</>,
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

  it("renders group labels", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    expect(screen.getByText("nav.groups.overview")).toBeInTheDocument()
    expect(screen.getByText("nav.groups.collections")).toBeInTheDocument()
    expect(screen.getByText("nav.groups.account")).toBeInTheDocument()
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

  it("renders vault icon and brand text when expanded", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    const logo = screen.getByAltText("GeekVault")
    expect(logo).toHaveAttribute("src", "vault-icon.png")
    expect(screen.getByText("GeekVault")).toBeInTheDocument()
    expect(screen.getByText("app.tagline")).toBeInTheDocument()
  })

  it("toggles collapsed state via edge chevron", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    const toggleBtn = screen.getByLabelText("nav.collapseSidebar")
    fireEvent.click(toggleBtn)
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
    expect(screen.getByLabelText("nav.collapseSidebar")).toBeInTheDocument()
    act(() => {
      window.dispatchEvent(new Event("toggle-sidebar"))
    })
    expect(screen.getByLabelText("nav.expandSidebar")).toBeInTheDocument()
  })

  it("renders collapsed sidebar with vault icon only", () => {
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

  it("renders group labels", () => {
    render(
      <MemoryRouter>
        <MobileSidebarContent onClose={onClose} />
      </MemoryRouter>
    )
    expect(screen.getByText("nav.groups.overview")).toBeInTheDocument()
    expect(screen.getByText("nav.groups.collections")).toBeInTheDocument()
    expect(screen.getByText("nav.groups.account")).toBeInTheDocument()
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
