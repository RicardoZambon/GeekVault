import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import AppLayout from "./app-layout"

vi.mock("./sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}))

vi.mock("./header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}))

vi.mock("./top-toolbar", () => ({
  TopToolbar: () => <div data-testid="top-toolbar">Top Toolbar</div>,
}))

vi.mock("./command-palette", () => ({
  CommandPalette: () => <div data-testid="command-palette">Command Palette</div>,
}))

vi.mock("./animated-outlet", () => ({
  AnimatedOutlet: () => <div data-testid="animated-outlet">Content</div>,
}))

describe("AppLayout", () => {
  it("renders sidebar", () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    )
    expect(screen.getByTestId("sidebar")).toBeInTheDocument()
  })

  it("renders header", () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    )
    expect(screen.getByTestId("header")).toBeInTheDocument()
  })

  it("renders top toolbar", () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    )
    expect(screen.getByTestId("top-toolbar")).toBeInTheDocument()
  })

  it("renders main content area with animated outlet", () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    )
    expect(screen.getByTestId("animated-outlet")).toBeInTheDocument()
  })

  it("renders command palette", () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    )
    expect(screen.getByTestId("command-palette")).toBeInTheDocument()
  })
})
