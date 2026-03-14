import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Dashboard from "./Dashboard"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({ token: "mock-token", user: null, isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() }),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}))

// Mock recharts to avoid rendering issues in jsdom
let capturedPieLabel: ((entry: { name: string; value: number }) => string) | null = null
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ label }: { label?: (entry: { name: string; value: number }) => string }) => {
    if (typeof label === "function") capturedPieLabel = label
    return <div>Pie</div>
  },
  Cell: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div>Bar</div>,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}))

const dashboardData = {
  totalCollections: 3,
  totalItems: 50,
  totalOwnedCopies: 25,
  totalEstimatedValue: 1500.5,
  totalInvested: 800.0,
  itemsByCondition: [
    { condition: "Mint", count: 10 },
    { condition: "Good", count: 15 },
  ],
  collectionSummaries: [
    { id: 1, name: "Comics", itemCount: 30, ownedCount: 15, value: 1000 },
  ],
  recentAcquisitions: [
    {
      id: 1,
      itemName: "Spider-Man #1",
      condition: "Mint",
      purchasePrice: 50.0,
      estimatedValue: 200.0,
      acquisitionDate: "2024-01-15",
      acquisitionSource: "eBay",
    },
    {
      id: 2,
      itemName: "Batman #1",
      condition: "Good",
      purchasePrice: null,
      estimatedValue: null,
      acquisitionDate: null,
      acquisitionSource: null,
    },
  ],
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows loading state", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}))
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByText("dashboard.loading")).toBeInTheDocument()
  })

  it("shows error state", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({ ok: false } as Response)
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("dashboard.fetchError")).toBeInTheDocument()
    })
  })

  it("renders dashboard data", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dashboardData),
    } as Response)

    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("dashboard.title")).toBeInTheDocument()
    })
    expect(screen.getByText("3")).toBeInTheDocument() // totalCollections
    expect(screen.getByText("50")).toBeInTheDocument() // totalItems
    expect(screen.getByText("Spider-Man #1")).toBeInTheDocument()
    expect(screen.getByText("Comics")).toBeInTheDocument()
  })

  it("renders null values with dash", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dashboardData),
    } as Response)

    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => screen.getByText("dashboard.title"))
    // Batman #1 has null values
    const dashes = screen.getAllByText("—")
    expect(dashes.length).toBeGreaterThan(0)
  })

  it("navigates to collection on click", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dashboardData),
    } as Response)

    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))
    fireEvent.click(screen.getByText("Comics"))
    expect(mockNavigate).toHaveBeenCalledWith("/collections/1")
  })

  it("shows empty state when no collections", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          ...dashboardData,
          totalCollections: 0,
          collectionSummaries: [],
          recentAcquisitions: [],
          itemsByCondition: [],
        }),
    } as Response)

    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("dashboard.empty")).toBeInTheDocument()
    })
  })

  it("calls pie chart label function correctly", async () => {
    capturedPieLabel = null
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dashboardData),
    } as Response)

    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("dashboard.title")).toBeInTheDocument()
    })

    // The Pie mock should have captured the label function
    expect(capturedPieLabel).not.toBeNull()
    const result = capturedPieLabel!({ name: "Mint", value: 10 })
    expect(result).toBe("Mint: 10")
  })

  it("returns null when data is null after loading", async () => {
    // This tests the `if (!data) return null` branch
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    } as Response)

    const { container } = render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.queryByText("dashboard.loading")).not.toBeInTheDocument()
    })
    // The component returns null, so no content
    expect(container.querySelector('[class*="space-y"]')).not.toBeInTheDocument()
  })
})
