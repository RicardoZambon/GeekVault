import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { RecentAcquisitions } from "./recent-acquisitions"

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

const mockAcquisitions = [
  {
    id: 1,
    itemName: "Charizard Base Set",
    condition: "Mint",
    purchasePrice: 350,
    estimatedValue: 500,
    acquisitionDate: new Date().toISOString(),
    acquisitionSource: "eBay",
  },
  {
    id: 2,
    itemName: "Spider-Man #1",
    condition: "Good",
    purchasePrice: null,
    estimatedValue: 200,
    acquisitionDate: null,
    acquisitionSource: null,
  },
  {
    id: 3,
    itemName: "Darth Vader Figure",
    condition: "Near Mint",
    purchasePrice: 75.5,
    estimatedValue: null,
    acquisitionDate: "2025-01-15",
    acquisitionSource: "Store",
  },
]

describe("RecentAcquisitions", () => {
  it("renders loading skeletons when loading", () => {
    const { container } = render(
      <RecentAcquisitions acquisitions={[]} loading />
    )
    expect(container.querySelectorAll(".skeleton-pulse").length).toBeGreaterThanOrEqual(3)
  })

  it("returns null when no acquisitions and not loading", () => {
    const { container } = render(
      <RecentAcquisitions acquisitions={[]} />
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders section title", () => {
    render(<RecentAcquisitions acquisitions={mockAcquisitions} />)
    expect(screen.getByText("dashboard.recentAcquisitions")).toBeInTheDocument()
  })

  it("renders item names", () => {
    render(<RecentAcquisitions acquisitions={mockAcquisitions} />)
    expect(screen.getByText("Charizard Base Set")).toBeInTheDocument()
    expect(screen.getByText("Spider-Man #1")).toBeInTheDocument()
    expect(screen.getByText("Darth Vader Figure")).toBeInTheDocument()
  })

  it("renders condition badges", () => {
    render(<RecentAcquisitions acquisitions={mockAcquisitions} />)
    expect(screen.getByText("Mint")).toBeInTheDocument()
    expect(screen.getByText("Good")).toBeInTheDocument()
    expect(screen.getByText("Near Mint")).toBeInTheDocument()
  })

  it("formats prices with dollar sign", () => {
    render(<RecentAcquisitions acquisitions={mockAcquisitions} />)
    expect(screen.getByText("$350.00")).toBeInTheDocument()
    expect(screen.getByText("$75.50")).toBeInTheDocument()
  })

  it("renders em-dash for null values", () => {
    render(<RecentAcquisitions acquisitions={mockAcquisitions} />)
    const dashes = screen.getAllByText("\u2014")
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it("renders relative date 'Today' for today's acquisition", () => {
    render(<RecentAcquisitions acquisitions={mockAcquisitions} />)
    expect(screen.getByText("Today")).toBeInTheDocument()
  })

  it("limits to 8 rows max", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      itemName: `Item ${i + 1}`,
      condition: "Mint",
      purchasePrice: 100,
      estimatedValue: 150,
      acquisitionDate: new Date().toISOString(),
      acquisitionSource: "Store",
    }))
    render(<RecentAcquisitions acquisitions={many} />)
    const rows = screen.getAllByText(/^Item \d+$/)
    expect(rows).toHaveLength(8)
  })

  it("has responsive column hiding classes", () => {
    const { container } = render(
      <RecentAcquisitions acquisitions={mockAcquisitions} />
    )
    const hiddenMd = container.querySelectorAll(".hidden.md\\:table-cell")
    const hiddenLg = container.querySelectorAll(".hidden.lg\\:table-cell")
    expect(hiddenMd.length).toBeGreaterThanOrEqual(1)
    expect(hiddenLg.length).toBeGreaterThanOrEqual(1)
  })

  it("renders table with rounded styling", () => {
    const { container } = render(
      <RecentAcquisitions acquisitions={mockAcquisitions} />
    )
    const table = container.querySelector("[class*='radius-lg']")
    expect(table).not.toBeNull()
  })
})
