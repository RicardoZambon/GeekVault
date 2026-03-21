import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { CollectionSummaries } from "./collection-summaries"

const mockNavigate = vi.fn()
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params?.count) return `${key}:${params.count}`
      return key
    },
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { variants, initial, animate, whileHover, whileTap, transition, ...rest } = props
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
  },
}))

const mockCollections = [
  { id: 1, name: "Pokemon Cards", itemCount: 50, ownedCount: 30, value: 1500 },
  { id: 2, name: "Marvel Comics", itemCount: 25, ownedCount: 20, value: 800.5 },
  { id: 3, name: "Star Wars Figures", itemCount: 15, ownedCount: 10, value: 2000 },
]

describe("CollectionSummaries", () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it("renders loading skeletons when loading", () => {
    const { container } = render(
      <CollectionSummaries collections={[]} loading />
    )
    expect(container.querySelectorAll(".skeleton-pulse").length).toBeGreaterThanOrEqual(3)
  })

  it("returns null when no collections and not loading", () => {
    const { container } = render(
      <CollectionSummaries collections={[]} />
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders section title 'Your Collections'", () => {
    render(<CollectionSummaries collections={mockCollections} />)
    expect(screen.getByText("dashboard.yourCollections")).toBeInTheDocument()
  })

  it("renders collection cards with names", () => {
    render(<CollectionSummaries collections={mockCollections} />)
    expect(screen.getByText("Pokemon Cards")).toBeInTheDocument()
    expect(screen.getByText("Marvel Comics")).toBeInTheDocument()
    expect(screen.getByText("Star Wars Figures")).toBeInTheDocument()
  })

  it("renders metadata rows (items, owned, value)", () => {
    render(<CollectionSummaries collections={mockCollections} />)
    expect(screen.getAllByText("dashboard.items")).toHaveLength(3)
    expect(screen.getAllByText("dashboard.owned")).toHaveLength(3)
    expect(screen.getAllByText("dashboard.value")).toHaveLength(3)
  })

  it("navigates to collection on click", () => {
    render(<CollectionSummaries collections={mockCollections} />)
    const cards = screen.getAllByRole("link")
    fireEvent.click(cards[0])
    expect(mockNavigate).toHaveBeenCalledWith("/collections/1")
  })

  it("navigates to collection on Enter key", () => {
    render(<CollectionSummaries collections={mockCollections} />)
    const cards = screen.getAllByRole("link")
    fireEvent.keyDown(cards[0], { key: "Enter" })
    expect(mockNavigate).toHaveBeenCalledWith("/collections/1")
  })

  it("cards have tabIndex=0 for keyboard accessibility", () => {
    render(<CollectionSummaries collections={mockCollections} />)
    const cards = screen.getAllByRole("link")
    cards.forEach((card) => {
      expect(card).toHaveAttribute("tabindex", "0")
    })
  })

  it("shows 'View all' link when totalCount > 6", () => {
    render(<CollectionSummaries collections={mockCollections} totalCount={10} />)
    expect(screen.getByText("dashboard.viewAllCount:10")).toBeInTheDocument()
  })

  it("does not show 'View all' link when <= 6 collections", () => {
    render(<CollectionSummaries collections={mockCollections} />)
    expect(screen.queryByText(/viewAll/)).not.toBeInTheDocument()
  })

  it("limits to 6 cards max", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: `Col ${i + 1}`,
      itemCount: 10,
      ownedCount: 5,
      value: 100,
    }))
    render(<CollectionSummaries collections={many} totalCount={8} />)
    const cards = screen.getAllByRole("link")
    expect(cards).toHaveLength(6)
  })

  it("renders gradient fallback when no cover image", () => {
    const { container } = render(<CollectionSummaries collections={mockCollections} />)
    const gradientDivs = container.querySelectorAll("[style*='linear-gradient']")
    expect(gradientDivs).toHaveLength(3)
  })

  it("renders 3-column grid layout on desktop", () => {
    const { container } = render(<CollectionSummaries collections={mockCollections} />)
    const grid = container.querySelector(".lg\\:grid-cols-3")
    expect(grid).not.toBeNull()
  })

  it("renders cover image when coverImagePath exists", () => {
    const withImage = [
      { ...mockCollections[0], coverImagePath: "/uploads/test.jpg" },
    ]
    render(<CollectionSummaries collections={withImage} />)
    const img = screen.getByAltText("Pokemon Cards")
    expect(img).toHaveAttribute("src", "/uploads/test.jpg")
  })
})
