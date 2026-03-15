import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ThemeProvider, useTheme } from "./theme-provider"

function ThemeConsumer() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={() => setTheme("system")}>Set System</button>
    </div>
  )
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("light", "dark")
  })

  it("renders children", () => {
    render(
      <ThemeProvider>
        <div>child</div>
      </ThemeProvider>
    )
    expect(screen.getByText("child")).toBeInTheDocument()
  })

  it("uses default theme", () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId("theme")).toHaveTextContent("light")
  })

  it("applies theme class to document", () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeConsumer />
      </ThemeProvider>
    )
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("applies system theme class", () => {
    render(
      <ThemeProvider defaultTheme="system">
        <ThemeConsumer />
      </ThemeProvider>
    )
    // matchMedia mock returns matches: false, so system = light
    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("changes theme and persists to localStorage", () => {
    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <ThemeConsumer />
      </ThemeProvider>
    )
    fireEvent.click(screen.getByText("Set Dark"))
    expect(screen.getByTestId("theme")).toHaveTextContent("dark")
    expect(localStorage.getItem("test-theme")).toBe("dark")
  })

  it("reads theme from localStorage", () => {
    localStorage.setItem("test-theme", "dark")
    render(
      <ThemeProvider storageKey="test-theme">
        <ThemeConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId("theme")).toHaveTextContent("dark")
  })
})

describe("useTheme outside provider", () => {
  it("returns default context values and setTheme is a no-op", () => {
    // The default context has setTheme as a no-op, theme as "system"
    // The guard checks for undefined which won't trigger since createContext provides a default
    let setThemeFn: ((theme: string) => void) | null = null
    function Consumer() {
      const { theme, setTheme } = useTheme()
      setThemeFn = setTheme as (theme: string) => void
      return <span>{theme}</span>
    }
    render(<Consumer />)
    expect(screen.getByText("system")).toBeInTheDocument()
    // Call the default setTheme (line 18) - it's a no-op returning null
    const result = setThemeFn!("dark" as never)
    expect(result).toBeNull()
  })
})

describe("ThemeProvider additional coverage", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("light", "dark")
  })

  it("switches from light to dark and updates document class", () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeConsumer />
      </ThemeProvider>
    )
    expect(document.documentElement.classList.contains("light")).toBe(true)
    fireEvent.click(screen.getByText("Set Dark"))
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.classList.contains("light")).toBe(false)
  })

  it("switches to system theme and resolves based on media query", () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeConsumer />
      </ThemeProvider>
    )
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    fireEvent.click(screen.getByText("Set System"))
    expect(screen.getByTestId("theme")).toHaveTextContent("system")
    // matchMedia mock returns false, so system resolves to "light"
    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("uses custom storage key", () => {
    render(
      <ThemeProvider defaultTheme="light" storageKey="custom-key">
        <ThemeConsumer />
      </ThemeProvider>
    )
    fireEvent.click(screen.getByText("Set Dark"))
    expect(localStorage.getItem("custom-key")).toBe("dark")
  })

  it("resolves system theme to dark when prefers-color-scheme is dark", () => {
    // Override matchMedia to return matches: true for dark scheme
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    render(
      <ThemeProvider defaultTheme="system">
        <ThemeConsumer />
      </ThemeProvider>
    )
    expect(document.documentElement.classList.contains("dark")).toBe(true)

    window.matchMedia = originalMatchMedia
  })
})
