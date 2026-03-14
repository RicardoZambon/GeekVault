import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Label } from "./label"

describe("Label", () => {
  it("renders a label element", () => {
    render(<Label>Email</Label>)
    expect(screen.getByText("Email")).toBeInTheDocument()
    expect(screen.getByText("Email").tagName).toBe("LABEL")
  })

  it("applies custom className", () => {
    render(<Label className="custom">Test</Label>)
    expect(screen.getByText("Test")).toHaveClass("custom")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLLabelElement | null }
    render(<Label ref={ref}>Ref</Label>)
    expect(ref.current).toBeInstanceOf(HTMLLabelElement)
  })

  it("passes htmlFor attribute", () => {
    render(<Label htmlFor="email-input">Email Label</Label>)
    expect(screen.getByText("Email Label")).toHaveAttribute("for", "email-input")
  })
})
