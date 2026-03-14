import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Button, buttonVariants } from "./button"

describe("Button", () => {
  it("renders with children", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole("button")).toHaveTextContent("Click me")
  })

  it("applies default variant classes", () => {
    render(<Button>Test</Button>)
    expect(screen.getByRole("button")).toHaveClass("bg-primary")
  })

  it("applies destructive variant", () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole("button")).toHaveClass("bg-destructive")
  })

  it("applies outline variant", () => {
    render(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole("button")).toHaveClass("border")
  })

  it("applies ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole("button")).toHaveClass("hover:bg-accent")
  })

  it("applies secondary variant", () => {
    render(<Button variant="secondary">Sec</Button>)
    expect(screen.getByRole("button")).toHaveClass("bg-secondary")
  })

  it("applies link variant", () => {
    render(<Button variant="link">Link</Button>)
    expect(screen.getByRole("button")).toHaveClass("text-primary")
  })

  it("applies sm size", () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByRole("button")).toHaveClass("h-8")
  })

  it("applies lg size", () => {
    render(<Button size="lg">Large</Button>)
    expect(screen.getByRole("button")).toHaveClass("h-10")
  })

  it("applies icon size", () => {
    render(<Button size="icon">I</Button>)
    expect(screen.getByRole("button")).toHaveClass("w-9")
  })

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>)
    expect(screen.getByRole("button")).toHaveClass("custom-class")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(<Button ref={ref}>Ref</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it("passes through HTML attributes", () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole("button")).toBeDisabled()
  })
})

describe("buttonVariants", () => {
  it("returns class string", () => {
    const result = buttonVariants({ variant: "default", size: "default" })
    expect(typeof result).toBe("string")
    expect(result).toContain("bg-primary")
  })
})
