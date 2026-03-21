import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ChartsSection } from "./charts-section"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { variants, initial, animate, ...rest } = props
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
  },
}))

const mockData = [
  { condition: "Mint", count: 10 },
  { condition: "Near Mint", count: 5 },
  { condition: "Good", count: 3 },
]

describe("ChartsSection", () => {
  it("renders loading skeletons when loading", () => {
    const { container } = render(
      <ChartsSection itemsByCondition={[]} loading />
    )
    expect(container.querySelectorAll(".skeleton-pulse").length).toBeGreaterThanOrEqual(2)
  })

  it("renders empty state when no data", () => {
    render(<ChartsSection itemsByCondition={[]} />)
    const emptyMessages = screen.getAllByText("dashboard.noConditionData")
    expect(emptyMessages).toHaveLength(2)
  })

  it("renders both chart titles with data", () => {
    render(<ChartsSection itemsByCondition={mockData} />)
    expect(screen.getByText("dashboard.itemsByCondition")).toBeInTheDocument()
    expect(screen.getByText("dashboard.conditionBreakdown")).toBeInTheDocument()
  })

  it("renders chart containers with correct height", () => {
    const { container } = render(<ChartsSection itemsByCondition={mockData} />)
    const chartAreas = container.querySelectorAll(".h-64")
    expect(chartAreas).toHaveLength(2)
  })

  it("renders custom legend for pie chart", () => {
    render(<ChartsSection itemsByCondition={mockData} />)
    expect(screen.getByText("Mint")).toBeInTheDocument()
    expect(screen.getByText("Near Mint")).toBeInTheDocument()
    expect(screen.getByText("Good")).toBeInTheDocument()
  })

  it("uses chart token CSS variables for colors", () => {
    const { container } = render(
      <ChartsSection itemsByCondition={mockData} />
    )
    const legendDots = container.querySelectorAll(".rounded-full")
    expect(legendDots.length).toBe(3)
    expect((legendDots[0] as HTMLElement).style.backgroundColor).toBe("var(--chart-1)")
  })

  it("renders two cards in grid layout", () => {
    const { container } = render(
      <ChartsSection itemsByCondition={mockData} />
    )
    const grid = container.firstElementChild as HTMLElement
    expect(grid.className).toContain("lg:grid-cols-2")
  })
})
