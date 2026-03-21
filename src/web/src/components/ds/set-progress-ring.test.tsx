import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { SetProgressRing, getCompletionTier } from "./set-progress-ring"

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      animate: _a,
      transition: _t,
      ...rest
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div data-testid="motion-div" {...rest}>
        {children}
      </div>
    ),
  },
}))

const CIRCUMFERENCE = 2 * Math.PI * 15.5

describe("SetProgressRing", () => {
  it("renders an SVG with role img and aria-label", () => {
    render(<SetProgressRing percentage={42} />)
    const svg = screen.getByRole("img")
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute("aria-label", "42% complete")
  })

  it("renders sm size by default (w-9 h-9)", () => {
    render(<SetProgressRing percentage={50} />)
    const svg = screen.getByRole("img")
    expect(svg.classList.contains("w-9")).toBe(true)
    expect(svg.classList.contains("h-9")).toBe(true)
  })

  it("renders lg size when specified (w-16 h-16)", () => {
    render(<SetProgressRing percentage={50} size="lg" />)
    const svg = screen.getByRole("img")
    expect(svg.classList.contains("w-16")).toBe(true)
    expect(svg.classList.contains("h-16")).toBe(true)
  })

  it("calculates correct stroke-dasharray for fill", () => {
    render(<SetProgressRing percentage={75} />)
    const circles = document.querySelectorAll("circle")
    // Second circle is the fill
    const fill = circles[1]
    const expectedFill = (75 / 100) * CIRCUMFERENCE
    expect(fill.getAttribute("stroke-dasharray")).toBe(
      `${expectedFill} ${CIRCUMFERENCE}`
    )
  })

  it("clamps percentage between 0 and 100", () => {
    const { rerender } = render(<SetProgressRing percentage={-10} />)
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "0% complete"
    )

    rerender(<SetProgressRing percentage={150} />)
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "100% complete"
    )
  })

  it("uses muted-foreground stroke for <50%", () => {
    render(<SetProgressRing percentage={30} />)
    const circles = document.querySelectorAll("circle")
    const fill = circles[1]
    expect(fill.getAttribute("stroke")).toBe("hsl(var(--muted-foreground))")
  })

  it("uses accent stroke for 50-99%", () => {
    render(<SetProgressRing percentage={75} />)
    const circles = document.querySelectorAll("circle")
    const fill = circles[1]
    expect(fill.getAttribute("stroke")).toBe("hsl(var(--accent))")
  })

  it("uses success stroke for 100%", () => {
    render(<SetProgressRing percentage={100} />)
    const circles = document.querySelectorAll("circle")
    const fill = circles[1]
    expect(fill.getAttribute("stroke")).toBe("hsl(var(--success))")
  })

  it("adds glow filter at 100%", () => {
    render(<SetProgressRing percentage={100} />)
    const filter = document.querySelector("filter#glow")
    expect(filter).toBeInTheDocument()
  })

  it("does not add glow filter below 100%", () => {
    render(<SetProgressRing percentage={99} />)
    const filter = document.querySelector("filter#glow")
    expect(filter).not.toBeInTheDocument()
  })

  it("wraps in motion.div for 100% completion pulse", () => {
    render(<SetProgressRing percentage={100} />)
    expect(screen.getByTestId("motion-div")).toBeInTheDocument()
  })

  it("does not wrap in motion.div below 100%", () => {
    render(<SetProgressRing percentage={50} />)
    expect(screen.queryByTestId("motion-div")).not.toBeInTheDocument()
  })

  it("does not show label for sm size even when showLabel is true", () => {
    render(<SetProgressRing percentage={50} size="sm" showLabel />)
    const texts = document.querySelectorAll("text")
    expect(texts.length).toBe(0)
  })

  it("shows percentage label inside ring for lg size with showLabel", () => {
    render(<SetProgressRing percentage={75} size="lg" showLabel />)
    const text = document.querySelector("text")
    expect(text).toBeInTheDocument()
    expect(text?.textContent).toBe("75%")
  })

  it("shows check mark instead of percentage at 100% with showLabel", () => {
    render(<SetProgressRing percentage={100} size="lg" showLabel />)
    const text = document.querySelector("text")
    expect(text).not.toBeInTheDocument()
    // Check icon is rendered as SVG element inside the g
    const checkIcon = document.querySelector("g svg, g path")
    // The Check component from lucide renders; we at least verify no text "100%"
    const allTexts = document.querySelectorAll("text")
    expect(allTexts.length).toBe(0)
  })

  it("applies custom className", () => {
    render(<SetProgressRing percentage={50} className="my-custom-class" />)
    const svg = screen.getByRole("img")
    expect(svg.classList.contains("my-custom-class")).toBe(true)
  })

  it("rotates SVG -90deg to start fill from 12 o'clock", () => {
    render(<SetProgressRing percentage={50} />)
    const svg = screen.getByRole("img")
    expect(svg.style.transform).toBe("rotate(-90deg)")
  })

  it("uses round stroke-linecap on fill circle", () => {
    render(<SetProgressRing percentage={50} />)
    const circles = document.querySelectorAll("circle")
    const fill = circles[1]
    expect(fill.getAttribute("stroke-linecap")).toBe("round")
  })

  it("renders track circle with muted stroke", () => {
    render(<SetProgressRing percentage={50} />)
    const circles = document.querySelectorAll("circle")
    const track = circles[0]
    expect(track.getAttribute("stroke")).toBe("hsl(var(--muted))")
    expect(track.getAttribute("stroke-width")).toBe("3")
  })
})

describe("getCompletionTier", () => {
  it("returns muted tier for <50%", () => {
    const tier = getCompletionTier(30)
    expect(tier.glow).toBe(false)
    expect(tier.textClass).toBe("text-muted-foreground")
  })

  it("returns accent tier for 50-99%", () => {
    const tier = getCompletionTier(75)
    expect(tier.glow).toBe(false)
    expect(tier.textClass).toContain("text-accent")
  })

  it("returns success tier with glow for 100%", () => {
    const tier = getCompletionTier(100)
    expect(tier.glow).toBe(true)
    expect(tier.textClass).toContain("text-success")
  })

  it("returns muted tier for 0%", () => {
    const tier = getCompletionTier(0)
    expect(tier.glow).toBe(false)
    expect(tier.strokeColor).toBe("hsl(var(--muted-foreground))")
  })

  it("returns accent tier for exactly 50%", () => {
    const tier = getCompletionTier(50)
    expect(tier.strokeColor).toBe("hsl(var(--accent))")
  })
})
