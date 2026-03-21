import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { CommandPalette } from "./command-palette"

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

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ theme: "light", setTheme: mockSetTheme }),
}))

// Mock cmdk to avoid jsdom issues with scrollIntoView and Radix Dialog
vi.mock("cmdk", () => ({
  CommandDialog: ({ open, children, label }: any) =>
    open ? (
      <div role="dialog" aria-label={label} data-testid="cmd-dialog">
        {children}
      </div>
    ) : null,
  CommandInput: ({ placeholder, ...props }: any) => (
    <input placeholder={placeholder} {...props} />
  ),
  CommandList: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CommandEmpty: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CommandGroup: ({ heading, children, ...props }: any) => (
    <div {...props}>
      {heading && <div>{heading}</div>}
      {children}
    </div>
  ),
  CommandItem: ({ children, onSelect, ...props }: any) => (
    <div role="option" onClick={onSelect} {...props}>
      {children}
    </div>
  ),
  CommandSeparator: (props: any) => <hr {...props} />,
}))

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it("renders without crashing", () => {
    const { container } = render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    expect(container).toBeTruthy()
  })

  it("opens on Ctrl+K keydown", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    expect(screen.getByPlaceholderText("commandPalette.placeholder")).toBeInTheDocument()
  })

  it("opens on Meta+K keydown (Mac)", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", metaKey: true })
    expect(screen.getByPlaceholderText("commandPalette.placeholder")).toBeInTheDocument()
  })

  it("does not open on key without ctrl/meta", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k" })
    expect(screen.queryByTestId("cmd-dialog")).not.toBeInTheDocument()
  })

  it("shows navigation items when open", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    expect(screen.getByText("nav.dashboard")).toBeInTheDocument()
    expect(screen.getByText("nav.collections")).toBeInTheDocument()
    expect(screen.getByText("nav.collectionTypes")).toBeInTheDocument()
    expect(screen.getByText("nav.wishlist")).toBeInTheDocument()
    expect(screen.getByText("nav.profile")).toBeInTheDocument()
  })

  it("shows action items when open", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    expect(screen.getByText("commandPalette.createCollection")).toBeInTheDocument()
    expect(screen.getByText("commandPalette.importData")).toBeInTheDocument()
  })

  it("shows settings items when open", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    expect(screen.getByText("commandPalette.toggleTheme")).toBeInTheDocument()
    expect(screen.getByText("commandPalette.toggleSidebar")).toBeInTheDocument()
    expect(screen.getByText("commandPalette.changeLanguage")).toBeInTheDocument()
  })

  it("shows group headings", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    expect(screen.getByText("commandPalette.navigation")).toBeInTheDocument()
    expect(screen.getByText("commandPalette.actions")).toBeInTheDocument()
    expect(screen.getByText("commandPalette.settings")).toBeInTheDocument()
  })

  it("shows footer hint bar with keyboard shortcuts", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    expect(screen.getByText("commandPalette.hintNavigate")).toBeInTheDocument()
    expect(screen.getByText("commandPalette.hintSelect")).toBeInTheDocument()
    expect(screen.getByText("commandPalette.hintDismiss")).toBeInTheDocument()
  })

  it("shows no results hint in empty state", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    expect(screen.getByText("commandPalette.noResults")).toBeInTheDocument()
    expect(screen.getByText("commandPalette.noResultsHint")).toBeInTheDocument()
  })

  it("navigates to dashboard on select", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    fireEvent.click(screen.getByText("nav.dashboard"))
    expect(mockNavigate).toHaveBeenCalledWith("/")
  })

  it("navigates to collections on select", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    fireEvent.click(screen.getByText("nav.collections"))
    expect(mockNavigate).toHaveBeenCalledWith("/collections")
  })

  it("navigates to collection-types on select", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    fireEvent.click(screen.getByText("nav.collectionTypes"))
    expect(mockNavigate).toHaveBeenCalledWith("/collection-types")
  })

  it("navigates to wishlist on select", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    fireEvent.click(screen.getByText("nav.wishlist"))
    expect(mockNavigate).toHaveBeenCalledWith("/wishlist")
  })

  it("navigates to profile on select", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    fireEvent.click(screen.getByText("nav.profile"))
    expect(mockNavigate).toHaveBeenCalledWith("/profile")
  })

  it("creates collection navigation on select", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    fireEvent.click(screen.getByText("commandPalette.createCollection"))
    expect(mockNavigate).toHaveBeenCalledWith("/collections?create=true")
  })

  it("toggles theme on select (light → dark)", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    fireEvent.click(screen.getByText("commandPalette.toggleTheme"))
    expect(mockSetTheme).toHaveBeenCalledWith("dark")
  })

  it("dispatches toggle-sidebar event on select", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent")
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    fireEvent.click(screen.getByText("commandPalette.toggleSidebar"))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event))
    dispatchSpy.mockRestore()
  })

  it("changes language on select", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    fireEvent.click(screen.getByText("commandPalette.changeLanguage"))
    expect(mockChangeLanguage).toHaveBeenCalledWith("pt")
  })

  it("shows recent pages from sessionStorage", () => {
    const recentPages = [
      { path: "/collections/1", label: "My Collection", timestamp: Date.now() - 60000 },
    ]
    sessionStorage.setItem("geekvault-recent-pages", JSON.stringify(recentPages))

    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    expect(screen.getByText("My Collection")).toBeInTheDocument()
    expect(screen.getByText("commandPalette.recent")).toBeInTheDocument()
  })

  it("navigates to recent page on select", () => {
    const recentPages = [
      { path: "/collections/5", label: "Vinyl Records", timestamp: Date.now() - 120000 },
    ]
    sessionStorage.setItem("geekvault-recent-pages", JSON.stringify(recentPages))

    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    fireEvent.click(screen.getByText("Vinyl Records"))
    expect(mockNavigate).toHaveBeenCalledWith("/collections/5")
  })

  it("imports data navigation on select", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
    fireEvent.click(screen.getByText("commandPalette.importData"))
    expect(mockNavigate).toHaveBeenCalledWith("/collections?import=true")
  })
})
