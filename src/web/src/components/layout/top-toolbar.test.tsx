import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { TopToolbar } from "./top-toolbar"

const mockChangeLanguage = vi.fn()
const mockSetTheme = vi.fn()

const mocks = vi.hoisted(() => ({
  user: { displayName: "John Doe", email: "john@test.com", avatar: null as string | null },
  theme: "light" as string,
  language: "en" as string,
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      get language() { return mocks.language },
      changeLanguage: mockChangeLanguage,
    },
  }),
}))

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({
    get theme() { return mocks.theme },
    setTheme: mockSetTheme,
  }),
}))

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({
    token: "mock-token",
    get user() { return mocks.user },
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
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

describe("TopToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.user = { displayName: "John Doe", email: "john@test.com", avatar: null }
    mocks.theme = "light"
    mocks.language = "en"
  })

  it("renders search trigger with placeholder text", () => {
    render(
      <MemoryRouter>
        <TopToolbar />
      </MemoryRouter>
    )
    expect(screen.getByText("toolbar.search")).toBeInTheDocument()
  })

  it("dispatches keyboard event on search click", () => {
    const dispatchSpy = vi.spyOn(document, "dispatchEvent")
    render(
      <MemoryRouter>
        <TopToolbar />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText("toolbar.search"))
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ key: "k", ctrlKey: true })
    )
    dispatchSpy.mockRestore()
  })

  it("renders help icon", () => {
    render(
      <MemoryRouter>
        <TopToolbar />
      </MemoryRouter>
    )
    expect(screen.getByText("toolbar.helpComingSoon")).toBeInTheDocument()
  })

  it("renders notifications", () => {
    render(
      <MemoryRouter>
        <TopToolbar />
      </MemoryRouter>
    )
    expect(screen.getByText("toolbar.noNotifications")).toBeInTheDocument()
  })

  it("renders language toggle and switches to pt", () => {
    render(
      <MemoryRouter>
        <TopToolbar />
      </MemoryRouter>
    )
    const langBtn = screen.getByLabelText("Português")
    fireEvent.click(langBtn)
    expect(mockChangeLanguage).toHaveBeenCalledWith("pt")
  })

  it("renders language toggle in pt mode and switches to en", () => {
    mocks.language = "pt"
    render(
      <MemoryRouter>
        <TopToolbar />
      </MemoryRouter>
    )
    const langBtn = screen.getByLabelText("English")
    fireEvent.click(langBtn)
    expect(mockChangeLanguage).toHaveBeenCalledWith("en")
  })

  it("renders theme toggle and switches to dark", () => {
    render(
      <MemoryRouter>
        <TopToolbar />
      </MemoryRouter>
    )
    const themeBtn = screen.getByLabelText("nav.toggleTheme")
    fireEvent.click(themeBtn)
    expect(mockSetTheme).toHaveBeenCalledWith("dark")
  })

  it("renders theme toggle in dark mode and switches to light", () => {
    mocks.theme = "dark"
    render(
      <MemoryRouter>
        <TopToolbar />
      </MemoryRouter>
    )
    const themeBtn = screen.getByLabelText("nav.toggleTheme")
    fireEvent.click(themeBtn)
    expect(mockSetTheme).toHaveBeenCalledWith("light")
  })

  it("renders user avatar with initials", () => {
    render(
      <MemoryRouter>
        <TopToolbar />
      </MemoryRouter>
    )
    expect(screen.getByText("JD")).toBeInTheDocument()
  })

  it("renders user avatar image when avatar url exists", () => {
    mocks.user = { displayName: "John Doe", email: "john@test.com", avatar: "/uploads/avatar.jpg" }
    const { container } = render(
      <MemoryRouter>
        <TopToolbar />
      </MemoryRouter>
    )
    const img = container.querySelector('img[src="/uploads/avatar.jpg"]')
    expect(img).toBeInTheDocument()
  })

  it("renders fallback initials when displayName is missing", () => {
    mocks.user = { displayName: "", email: "john@test.com", avatar: null }
    render(
      <MemoryRouter>
        <TopToolbar />
      </MemoryRouter>
    )
    expect(screen.getByText("?")).toBeInTheDocument()
  })
})
