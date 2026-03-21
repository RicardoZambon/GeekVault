import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Dashboard from "./dashboard-page"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({ token: "mock-token", user: { displayName: "Ralph" }, isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() }),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.name) return `${key}:${opts.name}`
      if (opts?.collections !== undefined) return `${key}:${opts.collections}:${opts.items}`
      if (opts?.count !== undefined) return `${key}:${opts.count}`
      return key
    },
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}))

vi.mock("framer-motion", () => ({
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useSpring: (val: number) => ({ get: () => val }),
  useTransform: (_: any, __: any, range: number[]) => ({ get: () => range[0] }),
  useMotionValue: (val: number) => ({ get: () => val, set: () => {} }),
}))

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

vi.mock("@/components/ds", async () => {
  const actual = await vi.importActual("@/components/ds")
  return {
    ...actual,
    StaggerChildren: ({ children, ...props }: any) => {
      const { staggerDelay, ...rest } = props
      return <div {...rest}>{children}</div>
    },
    staggerItemVariants: {},
    FadeIn: ({ children }: any) => <div>{children}</div>,
    ScaleIn: ({ children }: any) => <div>{children}</div>,
    PageTransition: ({ children }: any) => <div>{children}</div>,
    AnimatedNumber: ({ value, format }: { value: number; format?: (n: number) => string }) => (
      <span>{format ? format(value) : value}</span>
    ),
    toast: mockToast,
  }
})

// Mock recharts to avoid rendering issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => <div>Pie</div>,
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
    {
      id: 3,
      itemName: "X-Men #1",
      condition: "Near Mint",
      purchasePrice: 30.0,
      estimatedValue: 100.0,
      acquisitionDate: "2024-02-10",
      acquisitionSource: "Store",
    },
    {
      id: 4,
      itemName: "Flash #5",
      condition: "Fair",
      purchasePrice: 5.0,
      estimatedValue: 10.0,
      acquisitionDate: "2024-03-01",
      acquisitionSource: null,
    },
    {
      id: 5,
      itemName: "Hulk #3",
      condition: "Poor",
      purchasePrice: 2.0,
      estimatedValue: 5.0,
      acquisitionDate: null,
      acquisitionSource: "Yard Sale",
    },
    {
      id: 6,
      itemName: "Iron Man #10",
      condition: "Excellent",
      purchasePrice: 40.0,
      estimatedValue: 80.0,
      acquisitionDate: "2024-04-15",
      acquisitionSource: "Online",
    },
    {
      id: 7,
      itemName: "Thor #2",
      condition: "Used",
      purchasePrice: 3.0,
      estimatedValue: 6.0,
      acquisitionDate: "2024-05-01",
      acquisitionSource: null,
    },
  ],
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows loading state with skeleton elements including greeting skeleton", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}))
    const { container } = render(<MemoryRouter><Dashboard /></MemoryRouter>)
    // Loading state renders SkeletonRect components which have skeleton-pulse class
    const skeletons = container.querySelectorAll(".skeleton-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
    // Greeting skeleton: 280px wide title + 200px wide subtitle
    expect(skeletons.length).toBeGreaterThanOrEqual(2)
  })

  it("shows error via toast on fetch failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({ ok: false } as Response)
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("dashboard.fetchError")
    })
  })

  it("renders dashboard data with stats and sections", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dashboardData),
    } as Response)

    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      // Time-aware greeting with user name
      expect(screen.getByText(/dashboard\.greeting\.\w+:Ralph/)).toBeInTheDocument()
    })
    // Stats are rendered via AnimatedNumber mock
    expect(screen.getByText("3")).toBeInTheDocument() // totalCollections
    expect(screen.getByText("50")).toBeInTheDocument() // totalItems
    expect(screen.getAllByText("25").length).toBeGreaterThanOrEqual(1) // totalOwnedCopies (may also appear in chart center)
    // Recent acquisitions
    expect(screen.getByText("Spider-Man #1")).toBeInTheDocument()
    // Collection summaries
    expect(screen.getByText("Comics")).toBeInTheDocument()
  })

  it("shows time-aware greeting with user display name", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dashboardData),
    } as Response)

    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      // Should render one of morning/afternoon/evening with Ralph
      expect(screen.getByText(/dashboard\.greeting\.\w+:Ralph/)).toBeInTheDocument()
    })
  })

  it("shows subtitle with collection and item counts", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dashboardData),
    } as Response)

    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("dashboard.subtitle.withData:3:50")).toBeInTheDocument()
    })
  })

  it("shows empty subtitle when no collections", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...dashboardData, totalCollections: 0, collectionSummaries: [], recentAcquisitions: [], itemsByCondition: [] }),
    } as Response)

    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("dashboard.subtitle.empty")).toBeInTheDocument()
    })
  })

  it("renders null values with dash in recent acquisitions", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dashboardData),
    } as Response)

    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => screen.getByText(/dashboard\.greeting/))
    // Batman #1 has null purchasePrice, estimatedValue, acquisitionDate, acquisitionSource
    const dashes = screen.getAllByText("\u2014")
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

  it("shows empty state when totalCollections is 0", async () => {
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
      expect(screen.getByText("emptyStates.dashboard.title")).toBeInTheDocument()
    })
    expect(screen.getByText("emptyStates.dashboard.description")).toBeInTheDocument()
    expect(screen.getByText("emptyStates.dashboard.hint")).toBeInTheDocument()
  })

  it("navigates to collections with create param from empty state action", async () => {
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
    await waitFor(() => screen.getByText("emptyStates.dashboard.title"))
    fireEvent.click(screen.getByText("emptyStates.dashboard.action"))
    expect(mockNavigate).toHaveBeenCalledWith("/collections?create=true")
  })

  it("renders stats and sections when data is loaded (not empty)", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dashboardData),
    } as Response)

    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => screen.getByText(/dashboard\.greeting/))

    // Verify stats labels
    expect(screen.getByText("dashboard.totalCollections")).toBeInTheDocument()
    expect(screen.getByText("dashboard.totalItems")).toBeInTheDocument()
    expect(screen.getByText("dashboard.totalOwned")).toBeInTheDocument()
    expect(screen.getByText("dashboard.totalValue")).toBeInTheDocument()
    expect(screen.getByText("dashboard.totalInvested")).toBeInTheDocument()

    // Section titles
    expect(screen.getByText("dashboard.yourCollections")).toBeInTheDocument()
    expect(screen.getByText("dashboard.recentAcquisitions")).toBeInTheDocument()
  })

  it("renders data=null after loading without crashing", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    } as Response)

    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    // data is null, loading is false, isEmpty check: !loading && data !== null && data.totalCollections === 0
    // data is null so isEmpty is false, falls through to render stats with 0 values
    await waitFor(() => {
      expect(screen.getByText(/dashboard\.greeting/)).toBeInTheDocument()
    })
  })

  it("shows collection summary values", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dashboardData),
    } as Response)

    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))
    // Collection summary details
    expect(screen.getByText("30")).toBeInTheDocument() // itemCount
    expect(screen.getByText("15")).toBeInTheDocument() // ownedCount
  })

  it("shows welcomeBack greeting when no display name", async () => {
    // Override auth mock for this test
    const authModule = await import("@/components/auth-provider")
    vi.spyOn(authModule, "useAuth").mockReturnValue({
      token: "mock-token",
      user: { displayName: "", email: "test@test.com" } as any,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    })

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dashboardData),
    } as Response)

    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("dashboard.greeting.welcomeBack")).toBeInTheDocument()
    })
  })
})
