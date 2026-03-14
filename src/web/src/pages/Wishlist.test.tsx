import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Wishlist from "./Wishlist"

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({ token: "tok", user: null, isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() }),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}))

const collections = [
  { id: 1, name: "Comics" },
  { id: 2, name: "Cards" },
]

const wishlistItems = [
  { id: 1, collectionId: 1, catalogItemId: null, name: "Spider-Man #50", priority: 1, targetPrice: 100.0, notes: "Hard to find" },
  { id: 2, collectionId: 1, catalogItemId: 5, name: "X-Men #1", priority: 2, targetPrice: null, notes: null },
]

describe("Wishlist", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockFetch(cols = collections, items = wishlistItems) {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      // Only collection 1 has wishlist items
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

  it("shows loading spinner", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}))
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    expect(document.querySelector(".animate-spin")).toBeInTheDocument()
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
      expect(screen.getByText("wishlist.empty")).toBeInTheDocument()
    })
  })

  it("shows error on fetch failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({ ok: false } as Response)
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("wishlist.fetchError")).toBeInTheDocument()
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

  it("opens edit dialog", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))
    const editButtons = screen.getAllByLabelText("wishlist.edit")
    fireEvent.click(editButtons[0])
    expect(await screen.findByText("wishlist.editTitle")).toBeInTheDocument()
  })

  it("opens delete dialog", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => screen.getByText("Spider-Man #50"))
    const deleteButtons = screen.getAllByLabelText("wishlist.delete")
    fireEvent.click(deleteButtons[0])
    expect(await screen.findByText("wishlist.deleteConfirm")).toBeInTheDocument()
  })

  it("shows target price", async () => {
    mockFetch()
    render(<MemoryRouter><Wishlist /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("Spider-Man #50")).toBeInTheDocument()
    })
    expect(screen.getByText(/\$100\.00/)).toBeInTheDocument()
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

    const select = screen.getByLabelText("wishlist.collectionLabel")
    fireEvent.change(select, { target: { value: "" } })
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
    const select = screen.getByLabelText("wishlist.collectionLabel")
    fireEvent.change(select, { target: { value: "" } })

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
    fireEvent.change(screen.getByLabelText("wishlist.priorityLabel"), { target: { value: "3" } })
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

    const editButtons = screen.getAllByLabelText("wishlist.edit")
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

    const deleteButtons = screen.getAllByLabelText("wishlist.delete")
    fireEvent.click(deleteButtons[0])
    await screen.findByText("wishlist.deleteConfirm")

    fireEvent.click(screen.getAllByText("wishlist.delete").pop()!)
    await waitFor(() => {
      expect(screen.queryByText("wishlist.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("shows error when delete fails", async () => {
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

    const deleteButtons = screen.getAllByLabelText("wishlist.delete")
    fireEvent.click(deleteButtons[0])
    await screen.findByText("wishlist.deleteConfirm")

    fireEvent.click(screen.getAllByText("wishlist.delete").pop()!)
    await waitFor(() => {
      expect(screen.getByText("wishlist.deleteFailed")).toBeInTheDocument()
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
    const deleteButtons = screen.getAllByLabelText("wishlist.delete")
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
    const deleteButtons = screen.getAllByLabelText("wishlist.delete")
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
})
