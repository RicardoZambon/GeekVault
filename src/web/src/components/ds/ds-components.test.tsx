import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card"
import { Badge } from "./badge"
import { EmptyState } from "./empty-state"
import { PageHeader } from "./page-header"
import { SkeletonRect, SkeletonCircle, SkeletonText } from "./skeleton"
import { StatCard } from "./stat-card"
import { DataTable, type DataTableColumn } from "./data-table"
import { Toaster } from "./toaster"

// ─── Card ────────────────────────────────────────────────────────────────────

describe("Card", () => {
  it("renders with children", () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText("Card content")).toBeInTheDocument()
  })

  it("applies default variant", () => {
    render(<Card data-testid="card">content</Card>)
    expect(screen.getByTestId("card")).toHaveClass("hover:shadow-md")
  })

  it("applies accent variant (has border-t-4)", () => {
    render(<Card variant="accent" data-testid="card">content</Card>)
    expect(screen.getByTestId("card")).toHaveClass("border-t-4")
  })

  it("applies flat variant", () => {
    render(<Card variant="flat" data-testid="card">content</Card>)
    expect(screen.getByTestId("card")).not.toHaveClass("hover:shadow-md")
    expect(screen.getByTestId("card")).not.toHaveClass("border-t-4")
  })

  it("applies custom className", () => {
    render(<Card className="my-custom" data-testid="card">content</Card>)
    expect(screen.getByTestId("card")).toHaveClass("my-custom")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<Card ref={ref}>content</Card>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it("renders all sub-components", () => {
    render(
      <Card>
        <CardHeader data-testid="header">
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent data-testid="content">Body</CardContent>
        <CardFooter data-testid="footer">Footer</CardFooter>
      </Card>
    )
    expect(screen.getByTestId("header")).toBeInTheDocument()
    expect(screen.getByText("Title")).toBeInTheDocument()
    expect(screen.getByText("Description")).toBeInTheDocument()
    expect(screen.getByTestId("content")).toBeInTheDocument()
    expect(screen.getByText("Body")).toBeInTheDocument()
    expect(screen.getByTestId("footer")).toBeInTheDocument()
    expect(screen.getByText("Footer")).toBeInTheDocument()
  })
})

// ─── Badge ───────────────────────────────────────────────────────────────────

describe("Badge", () => {
  it("renders with text", () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("applies default variant", () => {
    render(<Badge data-testid="badge">Tag</Badge>)
    expect(screen.getByTestId("badge")).toHaveClass("bg-secondary")
  })

  it("applies primary variant", () => {
    render(<Badge variant="primary" data-testid="badge">Tag</Badge>)
    expect(screen.getByTestId("badge")).toHaveClass("bg-primary")
  })

  it("applies accent variant", () => {
    render(<Badge variant="accent" data-testid="badge">Tag</Badge>)
    expect(screen.getByTestId("badge")).toHaveClass("bg-accent")
  })

  it("applies success variant", () => {
    render(<Badge variant="success" data-testid="badge">Tag</Badge>)
    expect(screen.getByTestId("badge")).toHaveClass("bg-success")
  })

  it("applies destructive variant", () => {
    render(<Badge variant="destructive" data-testid="badge">Tag</Badge>)
    expect(screen.getByTestId("badge")).toHaveClass("bg-destructive")
  })

  it("applies outline variant", () => {
    render(<Badge variant="outline" data-testid="badge">Tag</Badge>)
    expect(screen.getByTestId("badge")).toHaveClass("border")
  })

  it("applies sm size", () => {
    render(<Badge size="sm" data-testid="badge">Tag</Badge>)
    expect(screen.getByTestId("badge")).toHaveClass("text-xs")
  })

  it("applies md size", () => {
    render(<Badge size="md" data-testid="badge">Tag</Badge>)
    expect(screen.getByTestId("badge")).toHaveClass("text-sm")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLSpanElement | null }
    render(<Badge ref={ref}>Tag</Badge>)
    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
  })
})

// ─── EmptyState ──────────────────────────────────────────────────────────────

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No items" />)
    expect(screen.getByText("No items")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(<EmptyState title="No items" description="Try adding one" />)
    expect(screen.getByText("Try adding one")).toBeInTheDocument()
  })

  it("renders icon when provided", () => {
    render(
      <EmptyState
        title="No items"
        icon={<svg data-testid="icon" />}
      />
    )
    expect(screen.getByTestId("icon")).toBeInTheDocument()
  })

  it("renders action button when both actionLabel and onAction provided", () => {
    const onAction = vi.fn()
    render(
      <EmptyState title="No items" actionLabel="Add item" onAction={onAction} />
    )
    expect(screen.getByRole("button", { name: "Add item" })).toBeInTheDocument()
  })

  it("does not render button when actionLabel missing", () => {
    const onAction = vi.fn()
    render(<EmptyState title="No items" onAction={onAction} />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("calls onAction when button clicked", () => {
    const onAction = vi.fn()
    render(
      <EmptyState title="No items" actionLabel="Add item" onAction={onAction} />
    )
    fireEvent.click(screen.getByRole("button", { name: "Add item" }))
    expect(onAction).toHaveBeenCalledOnce()
  })
})

// ─── PageHeader ──────────────────────────────────────────────────────────────

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="Dashboard" />)
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(<PageHeader title="Dashboard" description="Overview of stats" />)
    expect(screen.getByText("Overview of stats")).toBeInTheDocument()
  })

  it("renders actions slot when provided", () => {
    render(
      <PageHeader
        title="Dashboard"
        actions={<button>New</button>}
      />
    )
    expect(screen.getByRole("button", { name: "New" })).toBeInTheDocument()
  })

  it("does not render description when not provided", () => {
    const { container } = render(<PageHeader title="Dashboard" />)
    expect(container.querySelector("p")).not.toBeInTheDocument()
  })
})

// ─── Skeleton ────────────────────────────────────────────────────────────────

describe("Skeleton", () => {
  it("SkeletonRect renders with skeleton-pulse class", () => {
    render(<SkeletonRect data-testid="rect" />)
    expect(screen.getByTestId("rect")).toHaveClass("skeleton-pulse")
  })

  it("SkeletonRect applies width and height styles", () => {
    render(<SkeletonRect data-testid="rect" width={100} height={50} />)
    const el = screen.getByTestId("rect")
    expect(el).toHaveStyle({ width: "100px", height: "50px" })
  })

  it("SkeletonCircle renders with rounded-full class", () => {
    render(<SkeletonCircle data-testid="circle" />)
    expect(screen.getByTestId("circle")).toHaveClass("rounded-full")
  })

  it("SkeletonCircle applies size", () => {
    render(<SkeletonCircle data-testid="circle" size={60} />)
    const el = screen.getByTestId("circle")
    expect(el).toHaveStyle({ width: "60px", height: "60px" })
  })

  it("SkeletonText renders correct number of lines", () => {
    const { container } = render(<SkeletonText lines={5} />)
    const lines = container.querySelectorAll(".skeleton-pulse")
    expect(lines).toHaveLength(5)
  })

  it("SkeletonText defaults to 3 lines", () => {
    const { container } = render(<SkeletonText />)
    const lines = container.querySelectorAll(".skeleton-pulse")
    expect(lines).toHaveLength(3)
  })
})

// ─── StatCard ────────────────────────────────────────────────────────────────

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard icon={<svg />} label="Total" value={42} />)
    expect(screen.getByText("Total")).toBeInTheDocument()
    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("renders icon", () => {
    render(<StatCard icon={<svg data-testid="stat-icon" />} label="Total" value={0} />)
    expect(screen.getByTestId("stat-icon")).toBeInTheDocument()
  })

  it("renders trend text when provided", () => {
    render(
      <StatCard
        icon={<svg />}
        label="Total"
        value={42}
        trend={{ direction: "up", text: "+10%" }}
      />
    )
    expect(screen.getByText(/\+10%/)).toBeInTheDocument()
  })

  it("does not render trend when not provided", () => {
    const { container } = render(
      <StatCard icon={<svg />} label="Total" value={42} />
    )
    // The trend arrows are unicode chars; if no trend, none should appear
    expect(container.textContent).not.toContain("\u2191")
    expect(container.textContent).not.toContain("\u2193")
  })

  it("up trend has success color class", () => {
    render(
      <StatCard
        icon={<svg />}
        label="Total"
        value={42}
        trend={{ direction: "up", text: "+10%" }}
      />
    )
    const trendEl = screen.getByText(/\+10%/)
    expect(trendEl).toHaveClass("text-success")
  })

  it("down trend has destructive color class", () => {
    render(
      <StatCard
        icon={<svg />}
        label="Total"
        value={42}
        trend={{ direction: "down", text: "-5%" }}
      />
    )
    const trendEl = screen.getByText(/-5%/)
    expect(trendEl).toHaveClass("text-destructive")
  })
})

// ─── DataTable ───────────────────────────────────────────────────────────────

interface TestRow {
  id: number
  name: string
  value: number
}

const columns: DataTableColumn<TestRow>[] = [
  { header: "Name", accessor: "name" as const },
  { header: "Value", accessor: "value" as const, sortable: true, sortKey: "value" },
]

const data: TestRow[] = [
  { id: 1, name: "Item A", value: 10 },
  { id: 2, name: "Item B", value: 20 },
]

describe("DataTable", () => {
  it("renders with data and column headers", () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText("Name")).toBeInTheDocument()
    expect(screen.getByText("Value")).toBeInTheDocument()
    expect(screen.getByText("Item A")).toBeInTheDocument()
    expect(screen.getByText("Item B")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText("20")).toBeInTheDocument()
  })

  it("renders empty state when data is empty and emptyState provided", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyState={<div>No data available</div>}
      />
    )
    expect(screen.getByText("No data available")).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("renders loading skeleton rows when loading=true", () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} loading={true} loadingRows={3} />
    )
    const skeletonRows = container.querySelectorAll("tbody tr")
    expect(skeletonRows).toHaveLength(3)
  })

  it("calls onSort when sortable column header clicked", () => {
    const onSort = vi.fn()
    render(
      <DataTable columns={columns} data={data} onSort={onSort} />
    )
    fireEvent.click(screen.getByText("Value"))
    expect(onSort).toHaveBeenCalledWith("value", "asc")
  })

  it("shows sort direction icon for active sort column", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        sortKey="value"
        sortDirection="asc"
        onSort={vi.fn()}
      />
    )
    // When sorted asc, ChevronUp should be rendered inside the Value header
    const valueHeader = screen.getByText("Value").closest("th")!
    const svgs = valueHeader.querySelectorAll("svg")
    expect(svgs.length).toBeGreaterThan(0)
  })

  it("calls onRowClick when row clicked", () => {
    const onRowClick = vi.fn()
    render(
      <DataTable columns={columns} data={data} onRowClick={onRowClick} />
    )
    fireEvent.click(screen.getByText("Item A"))
    expect(onRowClick).toHaveBeenCalledWith(data[0])
  })

  it("toggles sort direction from asc to desc on same column", () => {
    const onSort = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        sortKey="value"
        sortDirection="asc"
        onSort={onSort}
      />
    )
    fireEvent.click(screen.getByText("Value"))
    expect(onSort).toHaveBeenCalledWith("value", "desc")
  })

  it("shows desc sort icon", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        sortKey="value"
        sortDirection="desc"
        onSort={vi.fn()}
      />
    )
    const valueHeader = screen.getByText("Value").closest("th")!
    const svgs = valueHeader.querySelectorAll("svg")
    expect(svgs.length).toBeGreaterThan(0)
  })

  it("renders with render function column", () => {
    const columnsWithRender: DataTableColumn<TestRow>[] = [
      { header: "Name", accessor: "name" as const },
      { header: "Custom", accessor: "value" as const, render: (value) => <span>Val: {String(value)}</span> },
    ]
    render(<DataTable columns={columnsWithRender} data={data} />)
    expect(screen.getByText("Val: 10")).toBeInTheDocument()
    expect(screen.getByText("Val: 20")).toBeInTheDocument()
  })

  it("does not call onSort for non-sortable column", () => {
    const onSort = vi.fn()
    render(
      <DataTable columns={columns} data={data} onSort={onSort} />
    )
    fireEvent.click(screen.getByText("Name"))
    expect(onSort).not.toHaveBeenCalled()
  })

  it("shows unsorted icon for sortable column not currently sorted", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        sortKey="other"
        sortDirection="asc"
        onSort={vi.fn()}
      />
    )
    const valueHeader = screen.getByText("Value").closest("th")!
    const svgs = valueHeader.querySelectorAll("svg")
    expect(svgs.length).toBeGreaterThan(0)
  })
})

// ─── Toaster ─────────────────────────────────────────────────────────────────

describe("Toaster", () => {
  it("renders without crashing", () => {
    const { container } = render(<Toaster />)
    expect(container).toBeTruthy()
  })
})
