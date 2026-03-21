import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  PageTransition,
  FadeIn,
  StaggerChildren,
  ScaleIn,
  springs,
  durations,
  easings,
  getVariants,
} from "./motion"

describe("motion tokens", () => {
  it("exports springs config", () => {
    expect(springs.default.type).toBe("spring")
    expect(springs.gentle.stiffness).toBe(300)
    expect(springs.bouncy.damping).toBe(15)
    expect(springs.stiff.mass).toBe(0.5)
  })

  it("exports durations config", () => {
    expect(durations.instant).toBe(0.05)
    expect(durations.fast).toBe(0.15)
    expect(durations.normal).toBe(0.25)
    expect(durations.slow).toBe(0.4)
    expect(durations.deliberate).toBe(0.6)
  })

  it("exports easings config", () => {
    expect(easings.standard).toEqual([0.25, 0.1, 0.25, 1.0])
    expect(easings.enter).toEqual([0.0, 0.0, 0.2, 1.0])
    expect(easings.exit).toEqual([0.4, 0.0, 1.0, 1.0])
    expect(easings.emphasized).toEqual([0.2, 0.0, 0.0, 1.0])
  })

  it("getVariants returns variants object", () => {
    const variants = { initial: { opacity: 0 }, animate: { opacity: 1 } }
    const result = getVariants(variants)
    expect(result).toBeDefined()
    expect(result.initial).toBeDefined()
    expect(result.animate).toBeDefined()
  })
})

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
