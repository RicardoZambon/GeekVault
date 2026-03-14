import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Input } from "./input"

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input placeholder="Type here" />)
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument()
  })

  it("applies type attribute", () => {
    render(<Input type="email" data-testid="input" />)
    expect(screen.getByTestId("input")).toHaveAttribute("type", "email")
  })

  it("applies custom className", () => {
    render(<Input className="custom" data-testid="input" />)
    expect(screen.getByTestId("input")).toHaveClass("custom")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLInputElement | null }
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it("passes through HTML attributes", () => {
    render(<Input disabled data-testid="input" />)
    expect(screen.getByTestId("input")).toBeDisabled()
  })
})
