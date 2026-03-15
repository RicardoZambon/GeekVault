import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { TopToolbar } from "./top-toolbar"

const mockChangeLanguage = vi.fn()
const mockSetTheme = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: mockChangeLanguage },
  }),
}))

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ theme: "light", setTheme: mockSetTheme }),
}))

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({
    token: "mock-token",
    user: { displayName: "John Doe", email: "john@test.com", avatar: null },
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
      expect.objectContaining({ key: "k", metaKey: true })
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

  it("renders language toggle", () => {
    render(
      <MemoryRouter>
        <TopToolbar />
      </MemoryRouter>
    )
    const langBtn = screen.getByLabelText("Português")
    fireEvent.click(langBtn)
    expect(mockChangeLanguage).toHaveBeenCalledWith("pt")
  })

  it("renders theme toggle", () => {
    render(
      <MemoryRouter>
        <TopToolbar />
      </MemoryRouter>
    )
    const themeBtn = screen.getByLabelText("nav.toggleTheme")
    fireEvent.click(themeBtn)
    expect(mockSetTheme).toHaveBeenCalledWith("dark")
  })

  it("renders user avatar with initials", () => {
    render(
      <MemoryRouter>
        <TopToolbar />
      </MemoryRouter>
    )
    expect(screen.getByText("JD")).toBeInTheDocument()
  })
})
