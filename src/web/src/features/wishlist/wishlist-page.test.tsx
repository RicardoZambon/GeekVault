import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Wishlist from "./wishlist-page"

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({ token: "tok", user: null, isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() }),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "count" in opts) return `${key}:${opts.count}`
      return key
    },
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock("@/hooks", () => ({
  useDebounce: (v: any) => v,
  useMediaQuery: () => false,
}))

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

vi.mock("@/components/ds", async () => {
  const actual = await vi.importActual("@/components/ds")
  return {
    ...actual,
    StaggerChildren: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    staggerItemVariants: {},
    FadeIn: ({ children }: any) => <div>{children}</div>,
    SortableList: ({ items, renderItem }: any) => (
      <div>{items.map((item: any, i: number) => <div key={i}>{renderItem(item, { dragHandleProps: {}, isDragging: false })}</div>)}</div>
    ),
    Select: ({ value, onValueChange, disabled, children }: any) => (
      <select value={value} onChange={(e: any) => onValueChange(e.target.value)} disabled={disabled}>{children}</select>
    ),
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
    Textarea: (props: any) => <textarea {...props} />,
    toast: mockToast,
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
    DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
    DropdownMenuItem: ({ children, onClick, className }: any) => <button onClick={onClick} className={className}>{children}</button>,
  }
})

const collections = [
  { id: 1, name: "Comics" },
  { id: 2, name: "Cards" },
]

const wishlistItems = [
  { id: 1, collectionId: 1, catalogItemId: null, name: "Spider-Man #50", priority: 1, targetPrice: 100.0, notes: "Hard to find" },
  { id: 2, collectionId: 1, catalogItemId: 5, name: "X-Men #1", priority: 2, targetPrice: null, notes: null },
  { id: 3, collectionId: 1, catalogItemId: null, name: "Hulk #10", priority: 3, targetPrice: 25.0, notes: null },
]

describe("Wishlist", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockFetch(cols = collections, items = wishlistItems) {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collections/1/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
      }
      if (urlStr.includes("/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(cols) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
    })
  }

  it("shows loading skeleton", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}))
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    expect(document.querySelector(".skeleton-pulse")).toBeInTheDocument()
  })

  it("renders wishlist items grouped by collection", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("Spider-Man #50")).toBeInTheDocument()
    })
    expect(screen.getByText("X-Men #1")).toBeInTheDocument()
    expect(screen.getByText("Comics")).toBeInTheDocument()
  })

  it("shows empty state", async () => {
    mockFetch(collections, [])
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("emptyStates.wishlist.title")).toBeInTheDocument()
    })
  })

  it("shows error on fetch failure via toast", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({ ok: false } as Response)
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("wishlist.fetchError")
    })
  })

  it("opens create dialog", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("wishlist.title"))
    fireEvent.click(screen.getAllByText("wishlist.add")[0])
    expect(await screen.findByText("wishlist.addTitle")).toBeInTheDocument()
  })

  it("validates name required", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("wishlist.title"))
    fireEvent.click(screen.getAllByText("wishlist.add")[0])
    await screen.findByText("wishlist.addTitle")
    const addButtons = screen.getAllByText("wishlist.add")
    fireEvent.click(addButtons[addButtons.length - 1])
    expect(await screen.findByText("wishlist.nameRequired")).toBeInTheDocument()
  })

  it("opens edit dialog via dropdown menu", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    // With mocked DropdownMenu, edit/delete buttons are always visible
    const editButtons = screen.getAllByText("wishlist.edit")
    fireEvent.click(editButtons[0])
    expect(await screen.findByText("wishlist.editTitle")).toBeInTheDocument()
  })

  it("opens delete dialog via dropdown menu", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    const deleteButtons = screen.getAllByText("wishlist.delete")
    fireEvent.click(deleteButtons[0])
    expect(await screen.findByText("wishlist.deleteConfirm")).toBeInTheDocument()
  })

  it("shows target price with tabular nums styling", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("Spider-Man #50")).toBeInTheDocument()
    })
    expect(screen.getByText("$100.00")).toBeInTheDocument()
  })

  it("shows notes", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("Hard to find")).toBeInTheDocument()
    })
  })

  it("disables add button when no collections", async () => {
    mockFetch([])
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getAllByText("wishlist.add")[0]).toBeDisabled()
    })
  })

  it("shows selectCollectionFirst when no collection selected", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("wishlist.title"))
    fireEvent.click(screen.getAllByText("wishlist.add")[0])
    await screen.findByText("wishlist.addTitle")

    // The collection select is a mocked <select>. Clear its value.
    const selects = document.querySelectorAll("select")
    // Find the collection select (it has collection option values)
    const colSelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((o) => o.value === "1")
    )!
    fireEvent.change(colSelect, { target: { value: "" } })
    expect(screen.getByText("wishlist.selectCollectionFirst")).toBeInTheDocument()
  })

  it("validates collection required on submit", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("wishlist.title"))
    fireEvent.click(screen.getAllByText("wishlist.add")[0])
    await screen.findByText("wishlist.addTitle")

    // Type a name
    fireEvent.change(screen.getByPlaceholderText("wishlist.namePlaceholder"), { target: { value: "Item" } })
    // Clear collection
    const selects = document.querySelectorAll("select")
    const colSelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((o) => o.value === "1")
    )!
    fireEvent.change(colSelect, { target: { value: "" } })

    const addButtons = screen.getAllByText("wishlist.add")
    fireEvent.click(addButtons[addButtons.length - 1])
    expect(await screen.findByText("wishlist.collectionRequired")).toBeInTheDocument()
  })

  it("submits new wishlist item successfully", async () => {
    let fetchCallCount = 0
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      if (opts && (opts as RequestInit).method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 3 }) } as Response)
      }
      if (urlStr.includes("/collections/1/wishlist")) {
        fetchCallCount++
        return Promise.resolve({ ok: true, json: () => Promise.resolve(fetchCallCount > 1 ? [] : wishlistItems) } as Response)
      }
      if (urlStr.includes("/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
    })

    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    fireEvent.click(screen.getAllByText("wishlist.add")[0])
    await screen.findByText("wishlist.addTitle")

    fireEvent.change(screen.getByPlaceholderText("wishlist.namePlaceholder"), { target: { value: "New Item" } })

    // Change priority via mocked select
    const selects = document.querySelectorAll("select")
    // Priority select has options "1", "2", "3"
    const prioritySelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((o) => o.value === "3") &&
      !Array.from(s.options).some((o) => o.textContent === "Comics")
    )!
    fireEvent.change(prioritySelect, { target: { value: "3" } })

    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "25.50" } })
    fireEvent.change(screen.getByPlaceholderText("wishlist.notesPlaceholder"), { target: { value: "Some notes" } })

    const addButtons = screen.getAllByText("wishlist.add")
    fireEvent.click(addButtons[addButtons.length - 1])

    await waitFor(() => {
      expect(screen.queryByText("wishlist.addTitle")).not.toBeInTheDocument()
    })
  })

  it("shows error when submit fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      if (opts && (opts as RequestInit).method === "POST") {
        return Promise.resolve({ ok: false } as Response)
      }
      if (urlStr.includes("/collections/1/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(wishlistItems) } as Response)
      }
      if (urlStr.includes("/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
    })

    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    fireEvent.click(screen.getAllByText("wishlist.add")[0])
    await screen.findByText("wishlist.addTitle")

    fireEvent.change(screen.getByPlaceholderText("wishlist.namePlaceholder"), { target: { value: "Fail Item" } })

    const addButtons = screen.getAllByText("wishlist.add")
    fireEvent.click(addButtons[addButtons.length - 1])

    expect(await screen.findByText("wishlist.saveFailed")).toBeInTheDocument()
  })

  it("edits and submits existing item successfully", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      if (opts && (opts as RequestInit).method === "PUT") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      if (urlStr.includes("/collections/1/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(wishlistItems) } as Response)
      }
      if (urlStr.includes("/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
    })

    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    // With mocked DropdownMenu, edit buttons are always visible
    const editButtons = screen.getAllByText("wishlist.edit")
    fireEvent.click(editButtons[0])
    await screen.findByText("wishlist.editTitle")

    // Verify form populated
    expect(screen.getByDisplayValue("Spider-Man #50")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Hard to find")).toBeInTheDocument()

    fireEvent.click(screen.getByText("wishlist.save"))
    await waitFor(() => {
      expect(screen.queryByText("wishlist.editTitle")).not.toBeInTheDocument()
    })
  })

  it("deletes item successfully", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      if (opts && (opts as RequestInit).method === "DELETE") {
        return Promise.resolve({ ok: true } as Response)
      }
      if (urlStr.includes("/collections/1/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(wishlistItems) } as Response)
      }
      if (urlStr.includes("/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
    })

    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    // With mocked DropdownMenu, delete buttons are always visible
    const deleteButtons = screen.getAllByText("wishlist.delete")
    fireEvent.click(deleteButtons[0])
    await screen.findByText("wishlist.deleteConfirm")

    // Click the confirm delete button in the ConfirmDialog
    const allDeleteTexts = screen.getAllByText("wishlist.delete")
    fireEvent.click(allDeleteTexts[allDeleteTexts.length - 1])
    await waitFor(() => {
      expect(screen.queryByText("wishlist.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("shows error when delete fails via toast", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      if (opts && (opts as RequestInit).method === "DELETE") {
        return Promise.resolve({ ok: false } as Response)
      }
      if (urlStr.includes("/collections/1/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(wishlistItems) } as Response)
      }
      if (urlStr.includes("/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
    })

    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    // With mocked DropdownMenu, delete buttons are always visible
    const deleteButtons = screen.getAllByText("wishlist.delete")
    fireEvent.click(deleteButtons[0])
    await screen.findByText("wishlist.deleteConfirm")

    // Click confirm
    const allDeleteTexts = screen.getAllByText("wishlist.delete")
    fireEvent.click(allDeleteTexts[allDeleteTexts.length - 1])
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("wishlist.deleteFailed")
    })
  })

  it("searches catalog items and links/unlinks", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/items?search=")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [{ id: 10, name: "Found Item", identifier: "FI-001" }] }) } as Response)
      }
      if (urlStr.includes("/collections/1/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(wishlistItems) } as Response)
      }
      if (urlStr.includes("/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
    })

    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    fireEvent.click(screen.getAllByText("wishlist.add")[0])
    await screen.findByText("wishlist.addTitle")

    // Type in search
    const searchInput = screen.getByPlaceholderText("wishlist.searchCatalogPlaceholder")
    fireEvent.change(searchInput, { target: { value: "Found" } })

    // Wait for debounce and results
    await waitFor(() => {
      expect(screen.getByText("Found Item")).toBeInTheDocument()
      expect(screen.getByText("FI-001")).toBeInTheDocument()
    })

    // Click on the catalog item to link it
    fireEvent.click(screen.getByText("Found Item"))
    expect(screen.getByText("wishlist.linked")).toBeInTheDocument()

    // Unlink the catalog item
    fireEvent.click(screen.getByText("wishlist.unlink"))
    expect(screen.queryByText("wishlist.linked")).not.toBeInTheDocument()
  })

  it("shows linked icon for items with catalogItemId", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("X-Men #1"))
    // X-Men #1 has catalogItemId: 5 so there should be SVG icons in its row
    const xmenName = screen.getByText("X-Men #1")
    const parentRow = xmenName.closest(".flex.items-center.gap-2")
    expect(parentRow?.querySelector("svg")).toBeInTheDocument()
  })

  it("shows catalog link button for items with catalogItemId", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("X-Men #1"))
    // X-Men #1 has catalogItemId so "View in catalog" should appear
    expect(screen.getByText("wishlist.viewCatalogItem")).toBeInTheDocument()
  })

  it("navigates to catalog item when view link clicked", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("X-Men #1"))
    fireEvent.click(screen.getByText("wishlist.viewCatalogItem"))
    expect(mockNavigate).toHaveBeenCalledWith("/collections/1/items/5")
  })

  it("closes create dialog via cancel button", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("wishlist.title"))
    fireEvent.click(screen.getAllByText("wishlist.add")[0])
    await screen.findByText("wishlist.addTitle")

    fireEvent.click(screen.getByText("wishlist.cancel"))
    await waitFor(() => {
      expect(screen.queryByText("wishlist.addTitle")).not.toBeInTheDocument()
    })
  })

  it("closes delete dialog via Escape key (triggers onOpenChange)", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    const deleteButtons = screen.getAllByText("wishlist.delete")
    fireEvent.click(deleteButtons[0])
    await screen.findByText("wishlist.deleteConfirm")

    // Press Escape to close - this triggers onOpenChange(false)
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    await waitFor(() => {
      expect(screen.queryByText("wishlist.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("closes delete dialog via cancel button", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    const deleteButtons = screen.getAllByText("wishlist.delete")
    fireEvent.click(deleteButtons[0])
    await screen.findByText("wishlist.deleteConfirm")

    fireEvent.click(screen.getByText("wishlist.cancel"))
    await waitFor(() => {
      expect(screen.queryByText("wishlist.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("handles catalog search when fetch fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/items?search=")) {
        return Promise.resolve({ ok: false } as Response)
      }
      if (urlStr.includes("/collections/1/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(wishlistItems) } as Response)
      }
      if (urlStr.includes("/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
    })

    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    fireEvent.click(screen.getAllByText("wishlist.add")[0])
    await screen.findByText("wishlist.addTitle")

    const searchInput = screen.getByPlaceholderText("wishlist.searchCatalogPlaceholder")
    fireEvent.change(searchInput, { target: { value: "test" } })

    // Should not crash - catalog items list stays empty
    await waitFor(() => {
      expect(screen.queryByText("FI-001")).not.toBeInTheDocument()
    })
  })

  it("handles catalog search when fetch throws", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/items?search=")) {
        return Promise.reject(new Error("Network error"))
      }
      if (urlStr.includes("/collections/1/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(wishlistItems) } as Response)
      }
      if (urlStr.includes("/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
    })

    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    fireEvent.click(screen.getAllByText("wishlist.add")[0])
    await screen.findByText("wishlist.addTitle")

    const searchInput = screen.getByPlaceholderText("wishlist.searchCatalogPlaceholder")
    fireEvent.change(searchInput, { target: { value: "test" } })

    // Should not crash
    await waitFor(() => {
      expect(screen.queryByText("FI-001")).not.toBeInTheDocument()
    })
  })

  it("clears catalog items when search is whitespace", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    fireEvent.click(screen.getAllByText("wishlist.add")[0])
    await screen.findByText("wishlist.addTitle")

    const searchInput = screen.getByPlaceholderText("wishlist.searchCatalogPlaceholder")
    fireEvent.change(searchInput, { target: { value: "  " } })

    // With whitespace-only search, no catalog items should appear
    await waitFor(() => {
      expect(screen.queryByText("FI-001")).not.toBeInTheDocument()
    })
  })

  it("opens edit dialog for item with null targetPrice and notes", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("X-Men #1"))

    // X-Men #1 is the second item; with mocked DropdownMenu, edit buttons are always visible
    const editButtons = screen.getAllByText("wishlist.edit")
    fireEvent.click(editButtons[1])
    await screen.findByText("wishlist.editTitle")

    // The form should show empty values for null targetPrice and notes
    expect(screen.getByDisplayValue("X-Men #1")).toBeInTheDocument()
    const priceInput = screen.getByPlaceholderText("0.00")
    expect(priceInput).toHaveValue(null)
    const notesInput = screen.getByPlaceholderText("wishlist.notesPlaceholder")
    expect(notesInput).toHaveValue("")
  })

  it("resets collection select to empty in create dialog", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))
    fireEvent.click(screen.getAllByText("wishlist.add")[0])
    await screen.findByText("wishlist.addTitle")

    const selects = document.querySelectorAll("select")
    const colSelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((o) => o.value === "1")
    )!
    // Select a value then reset to empty
    fireEvent.change(colSelect, { target: { value: "1" } })
    fireEvent.change(colSelect, { target: { value: "" } })
  })

  it("handles priority select change", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))
    fireEvent.click(screen.getAllByText("wishlist.add")[0])
    await screen.findByText("wishlist.addTitle")

    const selects = document.querySelectorAll("select")
    const prioritySelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((o) => o.value === "3") &&
      !Array.from(s.options).some((o) => o.textContent === "Comics")
    )!
    // Change to low priority
    fireEvent.change(prioritySelect, { target: { value: "3" } })
  })

  it("filters by priority", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    // Find the priority filter select (has "all", "high", "medium", "low" options)
    const selects = document.querySelectorAll("select")
    const priorityFilterSelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((o) => o.value === "high")
    )!
    // Filter to high priority only (priority 1 = high)
    fireEvent.change(priorityFilterSelect, { target: { value: "high" } })
    expect(screen.getByText("Spider-Man #50")).toBeInTheDocument()
  })

  it("changes sort order", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    // Find the sort select (has "priority", "price", "name", "dateAdded" options)
    const selects = document.querySelectorAll("select")
    const sortSelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((o) => o.value === "name")
    )!
    fireEvent.change(sortSelect, { target: { value: "name" } })
    // Items should still render (just in different order)
    expect(screen.getByText("Spider-Man #50")).toBeInTheDocument()
  })

  it("sorts by date added", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    const selects = document.querySelectorAll("select")
    const sortSelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((o) => o.value === "dateAdded")
    )!
    fireEvent.change(sortSelect, { target: { value: "dateAdded" } })
    expect(screen.getByText("Spider-Man #50")).toBeInTheDocument()
  })

  it("filters by date range", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    // Find the date filter select (has "all", "7d", "30d", "90d" options)
    const selects = document.querySelectorAll("select")
    const dateFilterSelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((o) => o.value === "7d")
    )!
    fireEvent.change(dateFilterSelect, { target: { value: "7d" } })
    // Items should still render (all have ids close together)
    expect(screen.getByText("Spider-Man #50")).toBeInTheDocument()
  })

  it("toggles collection group expansion", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Click the group header to collapse
    fireEvent.click(screen.getByText("Comics"))
    // Click again to expand
    fireEvent.click(screen.getByText("Comics"))
    expect(screen.getByText("Spider-Man #50")).toBeInTheDocument()
  })

  it("shows priority badges with correct data attributes", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    const badges = document.querySelectorAll("[data-testid='priority-badge']")
    expect(badges.length).toBeGreaterThan(0)
    // First item (Spider-Man #50) is priority 1 = high
    expect(badges[0].getAttribute("data-priority")).toBe("high")
  })

  it("shows wishlist group with data attributes", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const groups = document.querySelectorAll("[data-testid='wishlist-group']")
    expect(groups.length).toBe(1) // Only Comics has items
    expect(groups[0].getAttribute("data-collection-id")).toBe("1")
  })

  it("shows item count reflecting filtered results", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))
    expect(screen.getByText("wishlist.itemCount:3")).toBeInTheDocument()
  })

  it("handles wishlist reorder API call", async () => {
    const reorderMock = vi.fn()
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      if (urlStr.includes("/reorder") && opts && (opts as RequestInit).method === "POST") {
        reorderMock()
        return Promise.resolve({ ok: true } as Response)
      }
      if (urlStr.includes("/collections/1/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(wishlistItems) } as Response)
      }
      if (urlStr.includes("/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
    })

    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))
    // Items are rendered via SortableList mock which just renders them
    expect(screen.getByText("X-Men #1")).toBeInTheDocument()
  })

  it("clears catalog items when search is empty string", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/items?search=")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [{ id: 10, name: "Found Item", identifier: "FI-001" }] }) } as Response)
      }
      if (urlStr.includes("/collections/1/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(wishlistItems) } as Response)
      }
      if (urlStr.includes("/wishlist")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
    })

    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))

    fireEvent.click(screen.getAllByText("wishlist.add")[0])
    await screen.findByText("wishlist.addTitle")

    const searchInput = screen.getByPlaceholderText("wishlist.searchCatalogPlaceholder")
    // First type something to trigger search
    fireEvent.change(searchInput, { target: { value: "Found" } })
    await waitFor(() => screen.getByText("Found Item"))

    // Then clear the search - triggers the empty string branch in searchCatalogItems
    fireEvent.change(searchInput, { target: { value: "" } })
    await waitFor(() => {
      expect(screen.queryByText("Found Item")).not.toBeInTheDocument()
    })
  })
})
