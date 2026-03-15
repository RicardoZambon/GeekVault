import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AnimatedOutlet } from "./animated-outlet"

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

vi.mock("@/components/ds", () => ({
  PageTransition: ({ children }: any) => <div data-testid="page-transition">{children}</div>,
}))

describe("AnimatedOutlet", () => {
  it("renders outlet content within PageTransition", () => {
    render(
      <MemoryRouter initialEntries={["/test"]}>
        <Routes>
          <Route element={<AnimatedOutlet />}>
            <Route path="/test" element={<div>Test Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByTestId("page-transition")).toBeInTheDocument()
    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })
})
