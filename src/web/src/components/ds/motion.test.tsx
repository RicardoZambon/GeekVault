import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { PageTransition, FadeIn, StaggerChildren, ScaleIn } from "./motion"

// framer-motion's motion.div will render as a div in test environment
describe("PageTransition", () => {
  it("renders children", () => {
    render(<PageTransition>Page content</PageTransition>)
    expect(screen.getByText("Page content")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(
      <PageTransition className="custom-class">Content</PageTransition>
    )
    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<PageTransition ref={ref}>Content</PageTransition>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})

describe("FadeIn", () => {
  it("renders children", () => {
    render(<FadeIn>Fading content</FadeIn>)
    expect(screen.getByText("Fading content")).toBeInTheDocument()
  })

  it("accepts delay prop", () => {
    render(<FadeIn delay={0.5}>Delayed</FadeIn>)
    expect(screen.getByText("Delayed")).toBeInTheDocument()
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<FadeIn ref={ref}>Content</FadeIn>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})

describe("StaggerChildren", () => {
  it("renders children", () => {
    render(
      <StaggerChildren>
        <div>Child 1</div>
        <div>Child 2</div>
      </StaggerChildren>
    )
    expect(screen.getByText("Child 1")).toBeInTheDocument()
    expect(screen.getByText("Child 2")).toBeInTheDocument()
  })

  it("accepts staggerDelay prop", () => {
    render(
      <StaggerChildren staggerDelay={0.1}>
        <div>Item</div>
      </StaggerChildren>
    )
    expect(screen.getByText("Item")).toBeInTheDocument()
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<StaggerChildren ref={ref}>Content</StaggerChildren>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})

describe("ScaleIn", () => {
  it("renders children", () => {
    render(<ScaleIn>Scaled content</ScaleIn>)
    expect(screen.getByText("Scaled content")).toBeInTheDocument()
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<ScaleIn ref={ref}>Content</ScaleIn>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})
