import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { UserMenu } from "./user-menu"

const mockLogout = vi.fn()
const mockNavigate = vi.fn()
const mockSetTheme = vi.fn()
const mockChangeLanguage = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: mockChangeLanguage },
  }),
}))

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({
    token: "mock-token",
    user: { displayName: "John Doe", email: "john@test.com", avatar: null },
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: mockLogout,
  }),
}))

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: mockSetTheme,
  }),
}))

vi.mock("@/components/ds", () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, onSelect, disabled, ...props }: any) => (
    <button onClick={onClick || onSelect} disabled={disabled} {...props}>{children}</button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
}))

describe("UserMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders trigger children", () => {
    render(
      <MemoryRouter>
        <UserMenu>
          <button>Open Menu</button>
        </UserMenu>
      </MemoryRouter>
    )
    expect(screen.getByText("Open Menu")).toBeInTheDocument()
  })

  it("shows user name and email", () => {
    render(
      <MemoryRouter>
        <UserMenu>
          <button>Menu</button>
        </UserMenu>
      </MemoryRouter>
    )
    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("john@test.com")).toBeInTheDocument()
  })

  it("shows Profile, Settings, Help, Language, Theme, Logout items", () => {
    render(
      <MemoryRouter>
        <UserMenu>
          <button>Menu</button>
        </UserMenu>
      </MemoryRouter>
    )
    expect(screen.getByText("nav.userMenu.profile")).toBeInTheDocument()
    expect(screen.getByText("nav.userMenu.settings")).toBeInTheDocument()
    expect(screen.getByText("nav.userMenu.help")).toBeInTheDocument()
    expect(screen.getByText(/nav\.userMenu\.language/)).toBeInTheDocument()
    expect(screen.getByText(/nav\.userMenu\.themeLabel/)).toBeInTheDocument()
    expect(screen.getByText("nav.userMenu.logout")).toBeInTheDocument()
  })

  it("navigates to /profile on Profile click", () => {
    render(
      <MemoryRouter>
        <UserMenu>
          <button>Menu</button>
        </UserMenu>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText("nav.userMenu.profile"))
    expect(mockNavigate).toHaveBeenCalledWith("/profile")
  })

  it("calls logout and navigates to /login on Logout click", () => {
    render(
      <MemoryRouter>
        <UserMenu>
          <button>Menu</button>
        </UserMenu>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText("nav.userMenu.logout"))
    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true })
  })

  it("toggles language on Language click", () => {
    render(
      <MemoryRouter>
        <UserMenu>
          <button>Menu</button>
        </UserMenu>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText(/nav\.userMenu\.language/))
    expect(mockChangeLanguage).toHaveBeenCalledWith("pt")
  })

  it("cycles theme on Theme click", () => {
    render(
      <MemoryRouter>
        <UserMenu>
          <button>Menu</button>
        </UserMenu>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText(/nav\.userMenu\.themeLabel/))
    expect(mockSetTheme).toHaveBeenCalledWith("dark")
  })
})
