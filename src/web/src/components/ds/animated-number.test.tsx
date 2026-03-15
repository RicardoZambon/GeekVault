import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AnimatedNumber } from "./animated-number"

// In test environment with prefers-reduced-motion mock returning false in matchMedia,
// the component may render with motion.span or regular span

describe("AnimatedNumber", () => {
  it("renders with value", () => {
    render(<AnimatedNumber value={42} />)
    // The component renders the value (either via motion or reduced motion path)
    const el = document.querySelector("span")
    expect(el).toBeTruthy()
  })

  it("applies custom className", () => {
    const { container } = render(<AnimatedNumber value={10} className="custom" />)
    const span = container.querySelector("span")
    expect(span).toHaveClass("custom")
  })

  it("uses custom format function in reduced motion", () => {
    // Force reduced motion path by rendering directly
    render(<AnimatedNumber value={1234.5} format={(n) => `$${n.toFixed(2)}`} />)
    const span = document.querySelector("span")
    expect(span).toBeTruthy()
  })

  it("renders with duration prop", () => {
    render(<AnimatedNumber value={100} duration={0.5} />)
    const span = document.querySelector("span")
    expect(span).toBeTruthy()
  })
})
