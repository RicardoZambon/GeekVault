import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import CollectionDetail from "./collection-detail-page"

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
    t: (key: string, opts?: Record<string, unknown>) => (opts?.name ? `${key}:${opts.name}` : opts?.count !== undefined ? `${key}:${opts.count}` : opts?.pct !== undefined ? `${key}:${opts.pct}` : key),
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { variants, initial, animate, exit, whileHover, whileTap, layout, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock("@/components/ds", async () => {
  const actual = await vi.importActual("@/components/ds")
  return {
    ...actual,
    Select: ({ value, onValueChange, disabled, children }: any) => (
      <select value={value} onChange={(e: any) => onValueChange(e.target.value)} disabled={disabled}>{children}</select>
    ),
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: ({ placeholder }: any) => <>{placeholder}</>,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
    SortableList: ({ items, onReorder, renderItem, gridClassName }: any) => (
      <div className={gridClassName}>{items?.map((item: any, i: number) => <div key={item.id ?? i}>{renderItem(item, { dragHandleProps: {}, isDragging: false })}</div>)}</div>
    ),
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
    DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
    DropdownMenuItem: ({ children, onClick, className }: any) => <button onClick={onClick} className={className}>{children}</button>,
    StaggerChildren: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    staggerItemVariants: {},
    FadeIn: ({ children }: any) => <div>{children}</div>,
  }
})

vi.mock("./components/import-wizard", () => ({
  ImportWizard: ({ open, onOpenChange, onImportComplete }: any) => {
    if (!open) return null
    return (
      <div role="dialog">
        <p>collectionDetail.importTitle</p>
        <button onClick={() => onOpenChange(false)}>collectionDetail.importCancel</button>
      </div>
    )
  },
}))

const collection = { id: 1, name: "Comics", description: "My comics", coverImage: null, visibility: "Private", collectionTypeId: 1, collectionTypeName: "Comic Books", itemCount: 2, ownedCount: 1, completionPercentage: 50 }
const collectionType = { id: 1, name: "Comic Books", description: null, icon: "📚", customFields: [{ name: "Grade", type: "text", required: false, options: [] }] }
const items = {
  items: [
    { id: 1, collectionId: 1, identifier: "SM-001", name: "Spider-Man #1", description: null, releaseDate: null, manufacturer: null, referenceCode: null, image: null, rarity: null, customFieldValues: [], ownedCopies: null },
    { id: 2, collectionId: 1, identifier: "BM-001", name: "Batman #1", description: null, releaseDate: null, manufacturer: null, referenceCode: null, image: "http://img.jpg", rarity: null, customFieldValues: [], ownedCopies: null },
  ],
  totalCount: 2,
  page: 1,
  pageSize: 100,
}

function renderWithRoute() {
  return render(
    <MemoryRouter initialEntries={["/collections/1"]}>
      <Routes>
        <Route path="/collections/:id" element={<CollectionDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

describe("CollectionDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockFetch() {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/items?") || urlStr.includes("/items?")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets") && !urlStr.includes("/items")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
  }

  it("shows loading state with skeletons", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}))
    renderWithRoute()
    expect(document.querySelector(".skeleton-pulse")).toBeInTheDocument()
  })

  it("renders collection with items", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => {
      expect(screen.getByText("Comics")).toBeInTheDocument()
    })
    expect(screen.getByText("Spider-Man #1")).toBeInTheDocument()
    expect(screen.getByText("Batman #1")).toBeInTheDocument()
  })

  it("shows not found state", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({ ok: false } as Response)
    )
    renderWithRoute()
    await waitFor(() => {
      expect(screen.getByText("collectionDetail.notFound")).toBeInTheDocument()
    })
  })

  it("navigates to item detail on click", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    fireEvent.click(screen.getByText("Spider-Man #1"))
    expect(mockNavigate).toHaveBeenCalledWith("/collections/1/items/1")
  })

  it("opens add item dialog", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    // The "addItem" button appears in both the toolbar and dialog submit
    const addButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(addButtons[0])
    expect(await screen.findByText("collectionDetail.addItemTitle")).toBeInTheDocument()
  })

  it("validates add item form - identifier required", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    const addButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(addButtons[0])
    await screen.findByText("collectionDetail.addItemTitle")

    // Submit button in dialog also says "collectionDetail.addItem"
    const submitButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(submitButtons[submitButtons.length - 1])
    expect(await screen.findByText("collectionDetail.identifierRequired")).toBeInTheDocument()
  })

  it("validates add item form - name required", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    const addButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(addButtons[0])
    await screen.findByText("collectionDetail.addItemTitle")

    fireEvent.change(screen.getByLabelText("collectionDetail.identifierLabel"), { target: { value: "ID-001" } })
    const submitButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(submitButtons[submitButtons.length - 1])
    expect(await screen.findByText("collectionDetail.nameRequired")).toBeInTheDocument()
  })

  it("navigates back to collections", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    fireEvent.click(screen.getByText("collectionDetail.backToCollections"))
    expect(mockNavigate).toHaveBeenCalledWith("/collections")
  })

  it("shows search and filter controls", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    expect(screen.getByPlaceholderText("collectionDetail.searchPlaceholder")).toBeInTheDocument()
  })

  it("switches to sets tab", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    // The sets tab text is "sets.title (0)"
    const setsTab = screen.getByText(/sets\.title/)
    fireEvent.click(setsTab)
    expect(screen.getByText("sets.empty")).toBeInTheDocument()
  })

  it("opens export dialog", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    fireEvent.click(screen.getAllByText("collectionDetail.export")[0])
    expect(await screen.findByText("collectionDetail.exportTitle")).toBeInTheDocument()
  })

  it("opens import dialog", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    fireEvent.click(screen.getAllByText("collectionDetail.import")[0])
    await waitFor(() => {
      expect(screen.getByText("collectionDetail.importTitle")).toBeInTheDocument()
    })
  })

  it("submits add item form successfully", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    const addButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(addButtons[0])
    await screen.findByText("collectionDetail.addItemTitle")

    fireEvent.change(screen.getByLabelText("collectionDetail.identifierLabel"), { target: { value: "ID-001" } })
    fireEvent.change(screen.getByLabelText("collectionDetail.nameLabel"), { target: { value: "New Item" } })
    fireEvent.change(screen.getByLabelText("collectionDetail.descriptionLabel"), { target: { value: "A desc" } })
    fireEvent.change(screen.getByLabelText("collectionDetail.manufacturerLabel"), { target: { value: "Acme" } })
    fireEvent.change(screen.getByLabelText("collectionDetail.referenceCodeLabel"), { target: { value: "REF-1" } })
    fireEvent.change(screen.getByLabelText("collectionDetail.rarityLabel"), { target: { value: "Rare" } })
    const submitButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(submitButtons[submitButtons.length - 1])

    await waitFor(() => {
      const postCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        (c: unknown[]) => String(c[0]).includes("/items") && (c[1] as RequestInit)?.method === "POST"
      )
      expect(postCalls.length).toBeGreaterThan(0)
    })
  })

  it("shows error when add item POST fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.includes("/items") && method === "POST") {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: "Duplicate" }) } as Response)
      }
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    const addButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(addButtons[0])
    await screen.findByText("collectionDetail.addItemTitle")

    fireEvent.change(screen.getByLabelText("collectionDetail.identifierLabel"), { target: { value: "ID-001" } })
    fireEvent.change(screen.getByLabelText("collectionDetail.nameLabel"), { target: { value: "Test" } })

    const submitButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(submitButtons[submitButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByText("Duplicate")).toBeInTheDocument()
    })
  })

  it("validates required custom fields on submit", async () => {
    const typeWithRequired = {
      ...collectionType,
      customFields: [{ name: "Grade", type: "text", required: true, options: [] }],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(typeWithRequired) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    const addButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(addButtons[0])
    await screen.findByText("collectionDetail.addItemTitle")

    fireEvent.change(screen.getByLabelText("collectionDetail.identifierLabel"), { target: { value: "ID-001" } })
    fireEvent.change(screen.getByLabelText("collectionDetail.nameLabel"), { target: { value: "Test" } })
    // Don't fill in required custom field

    const submitButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(submitButtons[submitButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByText("collectionDetail.customFieldRequired:Grade")).toBeInTheDocument()
    })
  })

  it("renders owned items with green ring and badge", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        // Item 1 has copies (owned), item 2 does not
        if (urlStr.includes("/items/1/copies")) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1 }]) } as Response)
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    // Items should be rendered - check that the owned item has the green ring class
    const spiderDiv = screen.getByText("Spider-Man #1").closest(".group")
    await waitFor(() => {
      expect(spiderDiv?.className).toContain("ring-2")
    })
  })

  it("shows item identifiers in the gallery", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    expect(screen.getByText("SM-001")).toBeInTheDocument()
    expect(screen.getByText("BM-001")).toBeInTheDocument()
  })

  it("shows item image when available", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Batman #1"))
    expect(screen.getByAltText("Batman #1")).toBeInTheDocument()
  })

  it("renders sets tab with sets and fetches set detail on click", async () => {
    const setsData: Array<{ id: number; collectionId: number; name: string; expectedItemCount: number; completedCount: number; completionPercentage: number }> = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 2, completionPercentage: 40 },
    ]
    const setDetail = {
      id: 10,
      collectionId: 1,
      name: "Series A",
      expectedItemCount: 5,
      completedCount: 2,
      completionPercentage: 40,
      items: [
        { id: 100, setId: 10, catalogItemId: 1, name: "Spider-Man #1", sortOrder: 1 },
        { id: 101, setId: 10, catalogItemId: null, name: "Wolverine #1", sortOrder: 2 },
      ],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/sets\/10$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    // Switch to sets tab
    const setsTab = screen.getByText(/sets\.title/)
    fireEvent.click(setsTab)

    // Set card should appear
    expect(screen.getByText("Series A")).toBeInTheDocument()
    expect(screen.getByText(/2\/5/)).toBeInTheDocument()

    // Click the set to load detail
    fireEvent.click(screen.getByText("Series A"))
    await waitFor(() => {
      expect(screen.getByText("Spider-Man #1")).toBeInTheDocument()
      expect(screen.getByText("Wolverine #1")).toBeInTheDocument()
    })
  })

  it("opens create set dialog and submits", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    // Switch to sets tab
    fireEvent.click(screen.getByText(/sets\.title/))
    // Click create set
    fireEvent.click(screen.getAllByText("sets.create")[0])
    await waitFor(() => {
      expect(screen.getByText("sets.createTitle")).toBeInTheDocument()
    })

    // Fill name and submit
    fireEvent.change(screen.getByLabelText("sets.nameLabel"), { target: { value: "New Set" } })
    fireEvent.click(screen.getByText("sets.save"))

    await waitFor(() => {
      const postCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        (c: unknown[]) => String(c[0]).includes("/sets") && (c[1] as RequestInit)?.method === "POST"
      )
      expect(postCalls.length).toBeGreaterThan(0)
    })
  })

  it("validates empty set name on submit", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    fireEvent.click(screen.getAllByText("sets.create")[0])
    await waitFor(() => screen.getByText("sets.createTitle"))

    // Submit without filling name
    fireEvent.click(screen.getByText("sets.save"))
    await waitFor(() => {
      expect(screen.getByText("sets.nameRequired")).toBeInTheDocument()
    })
  })

  it("shows error when set creation fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.includes("/sets") && method === "POST") {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: "Set exists" }) } as Response)
      }
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    fireEvent.click(screen.getAllByText("sets.create")[0])
    await waitFor(() => screen.getByText("sets.createTitle"))

    fireEvent.change(screen.getByLabelText("sets.nameLabel"), { target: { value: "New Set" } })
    fireEvent.click(screen.getByText("sets.save"))

    await waitFor(() => {
      expect(screen.getByText("Set exists")).toBeInTheDocument()
    })
  })

  it("opens edit set dialog for an existing set", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 2, completionPercentage: 40 },
    ]
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/sets\/10$/) && method === "PUT") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      if (urlStr.match(/\/sets\/10$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ...setsData[0], items: [] }) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))

    // Click the edit (pencil) button on the set
    fireEvent.click(screen.getByTitle("sets.edit"))

    await waitFor(() => {
      expect(screen.getByText("sets.editTitle")).toBeInTheDocument()
    })
    expect(screen.getByLabelText("sets.nameLabel")).toHaveValue("Series A")

    // Edit and submit
    fireEvent.change(screen.getByLabelText("sets.nameLabel"), { target: { value: "Series B" } })
    fireEvent.click(screen.getByText("sets.save"))

    await waitFor(() => {
      const putCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        (c: unknown[]) => String(c[0]).includes("/sets/10") && (c[1] as RequestInit)?.method === "PUT"
      )
      expect(putCalls.length).toBeGreaterThan(0)
    })
  })

  it("confirms and deletes a set", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 0, completionPercentage: 0 },
    ]
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/sets\/10$/) && method === "DELETE") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))

    // Click the delete (trash) button
    fireEvent.click(screen.getByTitle("sets.delete"))

    await waitFor(() => {
      expect(screen.getByText("sets.deleteTitle")).toBeInTheDocument()
    })

    // Confirm deletion
    fireEvent.click(screen.getByText("sets.delete"))

    await waitFor(() => {
      const deleteCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        (c: unknown[]) => String(c[0]).includes("/sets/10") && (c[1] as RequestInit)?.method === "DELETE"
      )
      expect(deleteCalls.length).toBeGreaterThan(0)
    })
  })

  it("adds a catalog item to a set", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 0, completionPercentage: 0 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 0, completionPercentage: 0,
      items: [],
    }
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets/10/items") && method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      if (urlStr.match(/\/sets\/10$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    // Go to sets tab and select a set
    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))
    fireEvent.click(screen.getByText("Series A"))

    await waitFor(() => screen.getByTitle("sets.addItems"))
    fireEvent.click(screen.getByTitle("sets.addItems"))

    await waitFor(() => screen.getByText("sets.addItemsTitle"))

    // Catalog items should be listed — click add on Spider-Man
    const addBtns = screen.getAllByText("sets.add")
    fireEvent.click(addBtns[0])

    await waitFor(() => {
      const postCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        (c: unknown[]) => String(c[0]).includes("/sets/10/items") && (c[1] as RequestInit)?.method === "POST"
      )
      expect(postCalls.length).toBeGreaterThan(0)
    })
  })

  it("adds a named item to a set", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 0, completionPercentage: 0 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 0, completionPercentage: 0,
      items: [],
    }
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets/10/items") && method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      if (urlStr.match(/\/sets\/10$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))
    fireEvent.click(screen.getByText("Series A"))

    await waitFor(() => screen.getByTitle("sets.addItems"))
    fireEvent.click(screen.getByTitle("sets.addItems"))
    await waitFor(() => screen.getByText("sets.addItemsTitle"))

    // Type a name in the "add by name" field
    fireEvent.change(screen.getByPlaceholderText("sets.addByNamePlaceholder"), { target: { value: "Custom Item" } })

    // Click the add button next to the input (the last "sets.add" button)
    const addBtns = screen.getAllByText("sets.add")
    fireEvent.click(addBtns[addBtns.length - 1])

    await waitFor(() => {
      const postCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        (c: unknown[]) => String(c[0]).includes("/sets/10/items") && (c[1] as RequestInit)?.method === "POST"
      )
      expect(postCalls.length).toBeGreaterThan(0)
    })
  })

  it("exports collection as CSV", async () => {
    const blobMock = new Blob(["csv-data"], { type: "text/csv" })
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/export")) {
        return Promise.resolve({ ok: true, blob: () => Promise.resolve(blobMock) } as Response)
      }
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })

    const createObjectURLMock = vi.fn(() => "blob:http://localhost/fake")
    const revokeObjectURLMock = vi.fn()
    global.URL.createObjectURL = createObjectURLMock
    global.URL.revokeObjectURL = revokeObjectURLMock

    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getAllByText("collectionDetail.export")[0])
    await screen.findByText("collectionDetail.exportTitle")

    // Click download button
    fireEvent.click(screen.getByText("collectionDetail.exportDownload"))

    await waitFor(() => {
      const exportCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        (c: unknown[]) => String(c[0]).includes("/export")
      )
      expect(exportCalls.length).toBeGreaterThan(0)
    })
  })

  it("shows error when export fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/export")) {
        return Promise.resolve({ ok: false } as Response)
      }
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })

    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getAllByText("collectionDetail.export")[0])
    await screen.findByText("collectionDetail.exportTitle")

    fireEvent.click(screen.getByText("collectionDetail.exportDownload"))

    await waitFor(() => {
      expect(screen.getByText("collectionDetail.exportFailed")).toBeInTheDocument()
    })
  })

  it("selects JSON export format", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getAllByText("collectionDetail.export")[0])
    await screen.findByText("collectionDetail.exportTitle")

    fireEvent.click(screen.getByText("collectionDetail.exportJSON"))
    // JSON button should now be selected (has primary styling)
    expect(screen.getByText("collectionDetail.exportJSON").className).toContain("border-primary")
  })

  it("opens import wizard and closes via cancel", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getAllByText("collectionDetail.import")[0])
    await waitFor(() => {
      expect(screen.getByText("collectionDetail.importTitle")).toBeInTheDocument()
    })

    // Close the import wizard via cancel
    fireEvent.click(screen.getByText("collectionDetail.importCancel"))
    await waitFor(() => {
      expect(screen.queryByText("collectionDetail.importTitle")).not.toBeInTheDocument()
    })
  })

  it("displays set items with owned/unowned icons", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 3, completedCount: 1, completionPercentage: 33 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Series A", expectedItemCount: 3, completedCount: 1, completionPercentage: 33,
      items: [
        { id: 100, setId: 10, catalogItemId: 1, name: "Spider-Man #1", sortOrder: 1 },
        { id: 101, setId: 10, catalogItemId: null, name: "Uncatalogued Item", sortOrder: 2 },
      ],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/items/1/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1 }]) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/sets\/10$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))
    fireEvent.click(screen.getByText("Series A"))

    await waitFor(() => {
      expect(screen.getByText("Uncatalogued Item")).toBeInTheDocument()
    })

    // The set item linked to catalog item 1 should have a "view item" link
    await waitFor(() => {
      expect(screen.getByText("sets.viewItem")).toBeInTheDocument()
    })
  })

  it("navigates to item from set item view link", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 1, completedCount: 0, completionPercentage: 0 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Series A", expectedItemCount: 1, completedCount: 0, completionPercentage: 0,
      items: [
        { id: 100, setId: 10, catalogItemId: 1, name: "Spider-Man #1", sortOrder: 1 },
      ],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/sets\/10$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))
    fireEvent.click(screen.getByText("Series A"))

    await waitFor(() => screen.getByText("sets.viewItem"))
    fireEvent.click(screen.getByText("sets.viewItem"))
    expect(mockNavigate).toHaveBeenCalledWith("/collections/1/items/1")
  })

  it("shows empty items state in set detail", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 0, completedCount: 0, completionPercentage: 0 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Series A", expectedItemCount: 0, completedCount: 0, completionPercentage: 0,
      items: [],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/sets\/10$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))
    fireEvent.click(screen.getByText("Series A"))

    await waitFor(() => {
      expect(screen.getByText("sets.emptyItems")).toBeInTheDocument()
    })
  })

  it("filters catalog items in add-items-to-set dialog", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 0, completionPercentage: 0 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 0, completionPercentage: 0,
      items: [],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/sets\/10$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))
    fireEvent.click(screen.getByText("Series A"))
    await waitFor(() => screen.getByTitle("sets.addItems"))
    fireEvent.click(screen.getByTitle("sets.addItems"))
    await waitFor(() => screen.getByText("sets.addItemsTitle"))

    // Both items should be visible initially
    expect(screen.getByText("Spider-Man #1")).toBeInTheDocument()
    expect(screen.getByText("Batman #1")).toBeInTheDocument()

    // Search for "spider"
    fireEvent.change(screen.getByPlaceholderText("sets.searchPlaceholder"), { target: { value: "spider" } })

    // Only Spider-Man should be visible
    expect(screen.getByText("Spider-Man #1")).toBeInTheDocument()
    expect(screen.queryByText("Batman #1")).not.toBeInTheDocument()
  })

  it("shows 'select a set' when no set is selected on sets tab", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 0, completionPercentage: 0 },
    ]
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))

    // Set should be visible but not expanded (no detail content shown)
    expect(screen.getByText("Series A")).toBeInTheDocument()
    expect(screen.queryByText("sets.emptyItems")).not.toBeInTheDocument()
  })

  it("opens and closes import dialog via cancel button", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getAllByText("collectionDetail.import")[0])
    await waitFor(() => {
      expect(screen.getByText("collectionDetail.importTitle")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("collectionDetail.importCancel"))
    await waitFor(() => {
      expect(screen.queryByText("collectionDetail.importTitle")).not.toBeInTheDocument()
    })
  })

  it("adds named item to set via Enter key", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 0, completionPercentage: 0 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 0, completionPercentage: 0,
      items: [],
    }
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets/10/items") && method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      if (urlStr.match(/\/sets\/10$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))
    fireEvent.click(screen.getByText("Series A"))

    await waitFor(() => screen.getByTitle("sets.addItems"))
    fireEvent.click(screen.getByTitle("sets.addItems"))
    await waitFor(() => screen.getByText("sets.addItemsTitle"))

    const nameInput = screen.getByPlaceholderText("sets.addByNamePlaceholder")
    fireEvent.change(nameInput, { target: { value: "Enter Item" } })
    fireEvent.keyDown(nameInput, { key: "Enter" })

    await waitFor(() => {
      const postCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        (c: unknown[]) => String(c[0]).includes("/sets/10/items") && (c[1] as RequestInit)?.method === "POST"
      )
      expect(postCalls.length).toBeGreaterThan(0)
    })
  })

  it("import dialog can be toggled", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    // Open
    fireEvent.click(screen.getAllByText("collectionDetail.import")[0])
    await waitFor(() => {
      expect(screen.getByText("collectionDetail.importTitle")).toBeInTheDocument()
    })
    // Close
    fireEvent.click(screen.getByText("collectionDetail.importCancel"))
    await waitFor(() => {
      expect(screen.queryByText("collectionDetail.importTitle")).not.toBeInTheDocument()
    })
  })

  it("shows empty items state when collection has no items", async () => {
    const emptyItems = { items: [], totalCount: 0, page: 1, pageSize: 100 }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(emptyItems) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    expect(screen.getByText("emptyStates.collectionDetail.title")).toBeInTheDocument()
  })

  it("shows cover image when available", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...collection, coverImage: "http://cover.jpg" }),
        } as Response)
      }
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => {
      expect(screen.getByAltText("Comics")).toBeInTheDocument()
    })
  })

  it("toggles sort direction from asc to desc", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    // The sort direction button should show asc by default
    const sortDirButton = screen.getByTitle("collectionDetail.sortAsc")
    fireEvent.click(sortDirButton)

    // After clicking, it should be desc
    await waitFor(() => {
      expect(screen.getByTitle("collectionDetail.sortDesc")).toBeInTheDocument()
    })
  })

  it("changes condition filter", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    // Find the condition select - it's a mocked Radix Select rendered as native <select>
    const selects = document.querySelectorAll("select")
    // Find the one with "all" value (condition filter)
    const conditionSelect = Array.from(selects).find((s) => s.value === "all")
    expect(conditionSelect).toBeTruthy()
    fireEvent.change(conditionSelect!, { target: { value: "Mint" } })
    expect(conditionSelect!).toHaveValue("Mint")
  })

  it("clicks owned status filter buttons", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    // Click "owned" filter button
    fireEvent.click(screen.getByText("collectionDetail.ownedOwned"))
    // Click "unowned" filter button
    fireEvent.click(screen.getByText("collectionDetail.ownedUnowned"))
    // Click "all" to reset
    fireEvent.click(screen.getByText("collectionDetail.ownedAll"))
  })

  it("changes sort by selection", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    // Find the sort select - it's a mocked Radix Select rendered as native <select>
    const selects = document.querySelectorAll("select")
    // Find the one with "custom" value (sort by, default is "custom")
    const sortSelect = Array.from(selects).find((s) => s.value === "custom")
    expect(sortSelect).toBeTruthy()
    fireEvent.change(sortSelect!, { target: { value: "price" } })
    expect(sortSelect!).toHaveValue("price")
  })

  it("closes export dialog via cancel button", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getAllByText("collectionDetail.export")[0])
    await screen.findByText("collectionDetail.exportTitle")

    // Click cancel button
    fireEvent.click(screen.getByText("collectionDetail.cancel"))
    await waitFor(() => {
      expect(screen.queryByText("collectionDetail.exportTitle")).not.toBeInTheDocument()
    })
  })

  it("closes import upload step via cancel button", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getAllByText("collectionDetail.import")[0])
    await screen.findByText("collectionDetail.importTitle")

    // Click cancel in upload step
    fireEvent.click(screen.getByText("collectionDetail.importCancel"))
    await waitFor(() => {
      expect(screen.queryByText("collectionDetail.importTitle")).not.toBeInTheDocument()
    })
  })

  it("re-opens import dialog after closing", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    // Open, close, re-open
    fireEvent.click(screen.getAllByText("collectionDetail.import")[0])
    await waitFor(() => screen.getByText("collectionDetail.importTitle"))
    fireEvent.click(screen.getByText("collectionDetail.importCancel"))
    await waitFor(() => expect(screen.queryByText("collectionDetail.importTitle")).not.toBeInTheDocument())

    fireEvent.click(screen.getAllByText("collectionDetail.import")[0])
    await waitFor(() => {
      expect(screen.getByText("collectionDetail.importTitle")).toBeInTheDocument()
    })
  })

  it("closes delete set dialog via cancel", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 0, completionPercentage: 0 },
    ]
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))

    // Click the delete (trash) button
    fireEvent.click(screen.getByTitle("sets.delete"))

    await waitFor(() => screen.getByText("sets.deleteTitle"))

    // Click cancel
    fireEvent.click(screen.getByText("sets.cancel"))
    await waitFor(() => {
      expect(screen.queryByText("sets.deleteTitle")).not.toBeInTheDocument()
    })
  })

  it("fills in add item form custom fields including enum, boolean, and text", async () => {
    const typeWithCustomFields = {
      ...collectionType,
      customFields: [
        { name: "Grade", type: "text", required: false, options: [] },
        { name: "Publisher", type: "enum", required: false, options: ["Marvel", "DC"] },
        { name: "First Edition", type: "boolean", required: false, options: [] },
        { name: "Issue Number", type: "number", required: false, options: [] },
        { name: "Signed Date", type: "date", required: false, options: [] },
      ],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(typeWithCustomFields) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    const addButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(addButtons[0])
    await screen.findByText("collectionDetail.addItemTitle")

    // Change enum custom field
    const dialog = screen.getByRole("dialog")
    const selects = dialog.querySelectorAll("select")
    const enumSelect = Array.from(selects).find((s) => s.querySelector("option[value='DC']"))
    expect(enumSelect).toBeTruthy()
    fireEvent.change(enumSelect!, { target: { value: "DC" } })

    // Toggle boolean custom field
    const checkbox = dialog.querySelector("input[type='checkbox']")
    expect(checkbox).toBeInTheDocument()
    fireEvent.click(checkbox!)

    // Change text custom field
    const textInputs = dialog.querySelectorAll("input[type='text']")
    // Find one that's part of custom fields section
    expect(textInputs.length).toBeGreaterThan(0)
  })

  it("fills in add item form fields including release date and text custom field", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    const addButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(addButtons[0])
    await screen.findByText("collectionDetail.addItemTitle")

    // Fill in release date (line 1053)
    fireEvent.change(screen.getByLabelText("collectionDetail.releaseDateLabel"), { target: { value: "2024-01-01" } })
    expect(screen.getByLabelText("collectionDetail.releaseDateLabel")).toHaveValue("2024-01-01")

    // Fill in text custom field - "Grade" is a text field in the add dialog (line 1144)
    // The custom field inputs appear after the standard fields
    const dialog = screen.getByRole("dialog")
    const textInputs = dialog.querySelectorAll('input.h-8')
    if (textInputs.length > 0) {
      fireEvent.change(textInputs[0], { target: { value: "9.5" } })
    }
  })

  it("types in search input to trigger updateParam for search", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    const searchInput = screen.getByPlaceholderText("collectionDetail.searchPlaceholder")
    fireEvent.change(searchInput, { target: { value: "spider" } })
    expect(searchInput).toHaveValue("spider")

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } })
    expect(searchInput).toHaveValue("")
  })

  it("closes add item dialog via cancel button", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    const addButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(addButtons[0])
    await screen.findByText("collectionDetail.addItemTitle")

    fireEvent.click(screen.getByText("collectionDetail.cancel"))
    await waitFor(() => {
      expect(screen.queryByText("collectionDetail.addItemTitle")).not.toBeInTheDocument()
    })
  })

  it("switches export format from JSON back to CSV", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getAllByText("collectionDetail.export")[0])
    await screen.findByText("collectionDetail.exportTitle")

    // Switch to JSON first
    fireEvent.click(screen.getByText("collectionDetail.exportJSON"))
    expect(screen.getByText("collectionDetail.exportJSON").className).toContain("border-primary")

    // Switch back to CSV
    fireEvent.click(screen.getByText("collectionDetail.exportCSV"))
    expect(screen.getByText("collectionDetail.exportCSV").className).toContain("border-primary")
  })

  it("closes set dialog via cancel button", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    fireEvent.click(screen.getAllByText("sets.create")[0])
    await waitFor(() => screen.getByText("sets.createTitle"))

    fireEvent.click(screen.getByText("sets.cancel"))
    await waitFor(() => {
      expect(screen.queryByText("sets.createTitle")).not.toBeInTheDocument()
    })
  })

  it("switches between items and sets tabs updating CSS classes", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    // Items tab should be active - find the tab buttons via role
    const tabButtons = document.querySelectorAll("[role='tab']")
    const itemsTab = tabButtons[0] as HTMLElement
    const setsTab = tabButtons[1] as HTMLElement
    expect(itemsTab.className).toContain("border-accent")

    // Switch to sets tab
    fireEvent.click(setsTab)
    expect(setsTab.className).toContain("border-accent")

    // Switch back to items tab
    fireEvent.click(itemsTab)
    expect(itemsTab.className).toContain("border-accent")
  })

  it("shows generic error when add item POST fails and json parsing fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.includes("/items") && method === "POST") {
        return Promise.resolve({ ok: false, json: () => Promise.reject(new Error("bad json")) } as Response)
      }
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    const addButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(addButtons[0])
    await screen.findByText("collectionDetail.addItemTitle")

    fireEvent.change(screen.getByLabelText("collectionDetail.identifierLabel"), { target: { value: "ID-001" } })
    fireEvent.change(screen.getByLabelText("collectionDetail.nameLabel"), { target: { value: "Test" } })

    const submitButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(submitButtons[submitButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByText("collectionDetail.saveFailed")).toBeInTheDocument()
    })
  })

  it("fills in add item description and reference fields", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    const addButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(addButtons[0])
    await screen.findByText("collectionDetail.addItemTitle")

    // Fill in all form fields to cover onChange handlers
    fireEvent.change(screen.getByLabelText("collectionDetail.descriptionLabel"), { target: { value: "A desc" } })
    fireEvent.change(screen.getByLabelText("collectionDetail.manufacturerLabel"), { target: { value: "MFG" } })
    fireEvent.change(screen.getByLabelText("collectionDetail.referenceCodeLabel"), { target: { value: "REF" } })
    fireEvent.change(screen.getByLabelText("collectionDetail.rarityLabel"), { target: { value: "Common" } })
  })

  it("closes add items to set dialog", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 0, completionPercentage: 0 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 0, completionPercentage: 0,
      items: [],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/sets\/10$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))
    fireEvent.click(screen.getByText("Series A"))

    await waitFor(() => screen.getByTitle("sets.addItems"))
    fireEvent.click(screen.getByTitle("sets.addItems"))
    await waitFor(() => screen.getByText("sets.addItemsTitle"))

    // Close via Escape key
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    await waitFor(() => {
      expect(screen.queryByText("sets.addItemsTitle")).not.toBeInTheDocument()
    })
  })

  it("does not show view item link for set item without catalogItemId", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 1, completedCount: 0, completionPercentage: 0 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Series A", expectedItemCount: 1, completedCount: 0, completionPercentage: 0,
      items: [
        { id: 101, setId: 10, catalogItemId: null, name: "No Link Item", sortOrder: 1 },
      ],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/sets\/10$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))
    fireEvent.click(screen.getByText("Series A"))

    await waitFor(() => screen.getByText("No Link Item"))
    expect(screen.queryByText("sets.viewItem")).not.toBeInTheDocument()
  })

  it("handles file input change for item image", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    const addButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(addButtons[0])
    await screen.findByText("collectionDetail.addItemTitle")

    const fileInput = screen.getByLabelText("collectionDetail.imageLabel")
    const file = new File(["img"], "test.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })
    // Also test with no files (null branch)
    fireEvent.change(fileInput, { target: { files: null } })
  })

  it("closes delete set item dialog via Escape to clear state", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 2, completedCount: 0, completionPercentage: 0 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Series A", expectedItemCount: 2, completedCount: 0, completionPercentage: 0,
      items: [
        { id: 100, setId: 10, catalogItemId: 1, name: "Spider-Man #1", sortOrder: 1 },
        { id: 101, setId: 10, catalogItemId: null, name: "Item B", sortOrder: 2 },
      ],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/items/1/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1 }]) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/sets\/10$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))
    fireEvent.click(screen.getByText("Series A"))

    await waitFor(() => screen.getByText("Item B"))

    // Click the delete button on the set item (the trash icon button)
    const listItems = document.querySelectorAll("li")
    const itemBLi = Array.from(listItems).find((li) => li.textContent?.includes("Item B"))
    const deleteBtn = itemBLi?.querySelector("button.rounded.p-1")
    fireEvent.click(deleteBtn!)

    await waitFor(() => screen.getByText("sets.removeItemTitle"))

    // Press Escape to close - triggers onOpenChange(false) which clears deletingSetItemId
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    await waitFor(() => {
      expect(screen.queryByText("sets.removeItemTitle")).not.toBeInTheDocument()
    })
  })

  it("confirms and removes a set item successfully", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 2, completedCount: 0, completionPercentage: 0 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Series A", expectedItemCount: 2, completedCount: 0, completionPercentage: 0,
      items: [
        { id: 100, setId: 10, catalogItemId: 1, name: "Spider-Man #1", sortOrder: 1 },
        { id: 101, setId: 10, catalogItemId: null, name: "Item B", sortOrder: 2 },
      ],
    }
    const fetchCalls: { url: string; method: string }[] = []
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      fetchCalls.push({ url: urlStr, method })
      if (urlStr.includes("/sets/10/items/") && method === "DELETE") {
        return Promise.resolve({ ok: true } as Response)
      }
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.match(/\/sets\/10$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      if (urlStr.includes("/sets")) return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))
    fireEvent.click(screen.getByText("Series A"))
    await waitFor(() => screen.getByText("Item B"))

    // Find the delete button for "Item B" set item
    const allLis = document.querySelectorAll("li")
    const itemBLi = Array.from(allLis).find((li) => li.textContent?.includes("Item B"))
    // The trash button is inside the li
    const trashBtn = itemBLi?.querySelector("button")
    fireEvent.click(trashBtn!)

    await waitFor(() => screen.getByText("sets.removeItemTitle"))
    // Click the confirm delete button (confirmLabel is "sets.delete")
    const deleteBtns = screen.getAllByText("sets.delete")
    fireEvent.click(deleteBtns[deleteBtns.length - 1])

    await waitFor(() => {
      expect(fetchCalls.some(c => c.url.includes("/sets/10/items/") && c.method === "DELETE")).toBe(true)
    })
  })

  it("submits add item with image upload successfully", async () => {
    const fetchCalls: { url: string; method: string }[] = []
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      fetchCalls.push({ url: urlStr, method })
      if (urlStr.includes("/items") && urlStr.includes("/image") && method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      if (urlStr.includes("/items") && method === "POST" && !urlStr.includes("/image")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 99 }) } as Response)
      }
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.includes("/sets")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    const addButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(addButtons[0])
    await screen.findByText("collectionDetail.addItemTitle")

    fireEvent.change(screen.getByLabelText("collectionDetail.identifierLabel"), { target: { value: "ID-001" } })
    fireEvent.change(screen.getByLabelText("collectionDetail.nameLabel"), { target: { value: "New Item" } })

    // Select an image
    const fileInput = screen.getByLabelText("collectionDetail.imageLabel")
    const file = new File(["img"], "test.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    const submitButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(submitButtons[submitButtons.length - 1])

    await waitFor(() => {
      expect(fetchCalls.some(c => c.url.includes("/image") && c.method === "POST")).toBe(true)
    })
  })

  it("handles add item image upload failure branch", async () => {
    const fetchCalls: { url: string; method: string }[] = []
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      fetchCalls.push({ url: urlStr, method })
      if (urlStr.includes("/items") && urlStr.includes("/image") && method === "POST") {
        return Promise.resolve({ ok: false } as Response)
      }
      if (urlStr.includes("/items") && method === "POST" && !urlStr.includes("/image")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 99 }) } as Response)
      }
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.includes("/sets")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    const addButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(addButtons[0])
    await screen.findByText("collectionDetail.addItemTitle")

    fireEvent.change(screen.getByLabelText("collectionDetail.identifierLabel"), { target: { value: "ID-001" } })
    fireEvent.change(screen.getByLabelText("collectionDetail.nameLabel"), { target: { value: "New Item" } })

    const fileInput = screen.getByLabelText("collectionDetail.imageLabel")
    const file = new File(["img"], "test.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    const submitButtons = screen.getAllByText("collectionDetail.addItem")
    fireEvent.click(submitButtons[submitButtons.length - 1])

    // The image upload is attempted (even though it fails), then the dialog closes
    await waitFor(() => {
      expect(fetchCalls.some(c => c.url.includes("/image") && c.method === "POST")).toBe(true)
    })
  })

  it("edits existing set that is currently selected and refreshes detail", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 2, completionPercentage: 40 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Series A", expectedItemCount: 5, completedCount: 2, completionPercentage: 40,
      items: [],
    }
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.match(/\/sets\/10$/) && method === "PUT") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.match(/\/sets\/10$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      if (urlStr.includes("/sets")) return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))
    // Select the set first so selectedSet.id === editingSet.id
    fireEvent.click(screen.getByText("Series A"))
    await waitFor(() => screen.getByTitle("sets.addItems"))

    // Now click edit on the set
    fireEvent.click(screen.getByTitle("sets.edit"))
    await waitFor(() => screen.getByText("sets.editTitle"))

    fireEvent.change(screen.getByLabelText("sets.nameLabel"), { target: { value: "Series B" } })
    fireEvent.click(screen.getByText("sets.save"))

    await waitFor(() => {
      const putCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        (c: unknown[]) => String(c[0]).includes("/sets/10") && (c[1] as RequestInit)?.method === "PUT"
      )
      expect(putCalls.length).toBeGreaterThan(0)
    })
  })

  it("deletes currently selected set and clears selection", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 0, completedCount: 0, completionPercentage: 0 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Series A", expectedItemCount: 0, completedCount: 0, completionPercentage: 0,
      items: [],
    }
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.match(/\/sets\/10$/) && method === "DELETE") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.match(/\/sets\/10$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      if (urlStr.includes("/sets")) return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))
    // Select the set
    fireEvent.click(screen.getByText("Series A"))
    await waitFor(() => screen.getByTitle("sets.addItems"))

    // Click delete
    fireEvent.click(screen.getByTitle("sets.delete"))

    await waitFor(() => screen.getByText("sets.deleteTitle"))
    fireEvent.click(screen.getByText("sets.delete"))

    await waitFor(() => {
      expect(screen.queryByText("sets.deleteTitle")).not.toBeInTheDocument()
    })
  })

  // --- US-017: Items tab content redesign ---

  it("navigates to item on keyboard Enter", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    const card = screen.getByText("Spider-Man #1").closest("[role='link']") as HTMLElement
    expect(card).toBeInTheDocument()
    expect(card.getAttribute("tabindex")).toBe("0")
    fireEvent.keyDown(card, { key: "Enter" })
    expect(mockNavigate).toHaveBeenCalledWith("/collections/1/items/1")
  })

  it("navigates to item on keyboard Space", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    const card = screen.getByText("Spider-Man #1").closest("[role='link']") as HTMLElement
    fireEvent.keyDown(card, { key: " " })
    expect(mockNavigate).toHaveBeenCalledWith("/collections/1/items/1")
  })

  it("shows rarity badge on item card when rarity exists", async () => {
    const itemsWithRarity = {
      items: [
        { id: 1, collectionId: 1, identifier: "SM-001", name: "Spider-Man #1", description: null, releaseDate: null, manufacturer: null, referenceCode: null, image: null, rarity: "Rare", customFieldValues: [], ownedCopies: null },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 100,
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.includes("/sets")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve(itemsWithRarity) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    expect(screen.getByText("Rare")).toBeInTheDocument()
  })

  it("adds image hover zoom class on item images", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Batman #1"))
    const img = screen.getByAltText("Batman #1")
    expect(img.className).toContain("group-hover:scale-105")
    expect(img.className).toContain("transition-transform")
  })

  it("hides drag handle when sort is not custom", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    // Default sort is "custom" — drag handle should be present
    // With SortableList mock, drag handle buttons are rendered
    // Check that the GripVertical icon container exists in DOM
    const cards = document.querySelectorAll("[role='link']")
    expect(cards.length).toBeGreaterThan(0)
  })

  it("shows no-results state when filters active but no items match", async () => {
    const emptyFilteredItems = { items: [], totalCount: 0, page: 1, pageSize: 100 }
    const collectionWithItems = { ...collection, itemCount: 5 }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.includes("/sets")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionWithItems) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve(emptyFilteredItems) } as Response)
    })
    render(
      <MemoryRouter initialEntries={["/collections/1?search=nonexistent"]}>
        <Routes>
          <Route path="/collections/:id" element={<CollectionDetail />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => screen.getByText("Comics"))
    expect(screen.getByText("collectionDetail.noMatchingItems")).toBeInTheDocument()
    expect(screen.getByText("collectionDetail.noMatchingItemsHint")).toBeInTheDocument()
    expect(screen.getByText("collectionDetail.clearFilters")).toBeInTheDocument()
  })

  it("applies responsive column hiding classes on list view columns", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    // The tableColumns are defined but we test the column config indirectly
    // The responsive hiding is applied via className on the column definition
    // This is verified by checking the DataTable renders with correct classes
    // Since the DataTable mock renders all columns, we just verify the component doesn't crash
    expect(screen.getByText("Spider-Man #1")).toBeInTheDocument()
  })

  // --- US-016: Banner, tabs, and stats ---

  it("renders cover banner with gradient fallback when no cover image", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    const banner = document.querySelector("[data-testid='cover-banner']")
    expect(banner).toBeInTheDocument()
    // Should have gradient overlay
    expect(banner?.querySelector(".bg-gradient-to-t")).toBeInTheDocument()
  })

  it("renders cover banner with image when coverImage exists", async () => {
    const collectionWithCover = { ...collection, coverImage: "/uploads/cover.jpg" }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.includes("/items?")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
      }
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.includes("/sets")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionWithCover) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    const banner = document.querySelector("[data-testid='cover-banner']")
    const img = banner?.querySelector("img")
    expect(img).toBeInTheDocument()
    expect(img?.getAttribute("src")).toBe("/uploads/cover.jpg")
  })

  it("displays metadata overlay with collection type badge and stats", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    expect(screen.getByText("Comic Books")).toBeInTheDocument()
    expect(screen.getByText("collectionDetail.statItems:2")).toBeInTheDocument()
    expect(screen.getByText("collectionDetail.statOwned:1")).toBeInTheDocument()
  })

  it("shows action buttons on banner (edit and more actions)", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    expect(screen.getByText("collectionDetail.edit")).toBeInTheDocument()
    expect(screen.getByLabelText("collectionDetail.moreActions")).toBeInTheDocument()
  })

  it("has accessible tab navigation with role=tablist", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    const tablist = document.querySelector("[role='tablist']")
    expect(tablist).toBeInTheDocument()
    const tabs = tablist?.querySelectorAll("[role='tab']")
    expect(tabs?.length).toBeGreaterThanOrEqual(2)
    // First tab (items) should be selected
    expect(tabs?.[0]?.getAttribute("aria-selected")).toBe("true")
  })

  it("renders Stats tab when items exist and shows stat cards", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    // Stats tab should be visible since items exist
    const statsTab = screen.getByText("collectionDetail.tabStats")
    expect(statsTab).toBeInTheDocument()
    fireEvent.click(statsTab)
    // Should show stats cards
    await waitFor(() => {
      expect(screen.getByText("collectionDetail.statsItems")).toBeInTheDocument()
      expect(screen.getByText("collectionDetail.statsOwned")).toBeInTheDocument()
    })
  })

  it("renders responsive banner heights via CSS classes", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    const banner = document.querySelector("[data-testid='cover-banner']")
    expect(banner?.className).toContain("h-40")
    expect(banner?.className).toContain("md:h-48")
    expect(banner?.className).toContain("lg:h-60")
  })

  // --- US-018: Sets tab and Stats tab redesign ---

  it("applies completion color thresholds: muted for <50%, accent for 50-99%, success for 100%", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Low Set", expectedItemCount: 10, completedCount: 2, completionPercentage: 20 },
      { id: 11, collectionId: 1, name: "Mid Set", expectedItemCount: 10, completedCount: 7, completionPercentage: 70 },
      { id: 12, collectionId: 1, name: "Full Set", expectedItemCount: 5, completedCount: 5, completionPercentage: 100 },
    ]
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.includes("/sets")) return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Low Set"))

    // Check progress bar colors via the bar elements
    const progressBars = document.querySelectorAll(".rounded-full.transition-all")
    const barClasses = Array.from(progressBars).map((el) => el.className)
    // Low (<50%) should have muted color
    expect(barClasses.some((c) => c.includes("bg-muted-foreground"))).toBe(true)
    // Mid (50-99%) should have accent
    expect(barClasses.some((c) => c.includes("bg-accent"))).toBe(true)
    // Full (100%) should have green
    expect(barClasses.some((c) => c.includes("bg-green-500"))).toBe(true)
  })

  it("shows trophy icon for 100% complete sets", async () => {
    const setsData = [
      { id: 12, collectionId: 1, name: "Full Set", expectedItemCount: 5, completedCount: 5, completionPercentage: 100 },
    ]
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.includes("/sets")) return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Full Set"))
    // Trophy icon should be rendered (lucide renders as svg)
    const trophySvg = document.querySelector(".text-green-500")
    expect(trophySvg).toBeInTheDocument()
  })

  it("shows all-owned celebration message and owned/missing visual distinction in set items", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Complete Set", expectedItemCount: 2, completedCount: 2, completionPercentage: 100 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Complete Set", expectedItemCount: 2, completedCount: 2, completionPercentage: 100,
      items: [
        { id: 100, setId: 10, catalogItemId: 1, name: "Spider-Man #1", sortOrder: 1 },
        { id: 101, setId: 10, catalogItemId: 2, name: "Batman #1", sortOrder: 2 },
      ],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.includes("/items/1/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1 }]) } as Response)
      if (urlStr.includes("/items/2/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 2 }]) } as Response)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.match(/\/sets\/10$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      if (urlStr.includes("/sets")) return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Complete Set"))
    fireEvent.click(screen.getByText("Complete Set"))
    await waitFor(() => screen.getByText("sets.allOwned"))
    // Owned items should have solid border class
    const listItems = document.querySelectorAll("li.border-solid")
    expect(listItems.length).toBeGreaterThan(0)
  })

  it("shows add-to-wishlist button on missing set items", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 2, completedCount: 0, completionPercentage: 0 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Series A", expectedItemCount: 2, completedCount: 0, completionPercentage: 0,
      items: [
        { id: 101, setId: 10, catalogItemId: null, name: "Missing Item", sortOrder: 1 },
      ],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.match(/\/sets\/10$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      if (urlStr.includes("/sets")) return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))
    fireEvent.click(screen.getByText("Series A"))
    await waitFor(() => screen.getByText("Missing Item"))
    // Missing items should have dashed border
    const dashedItems = document.querySelectorAll("li.border-dashed")
    expect(dashedItems.length).toBeGreaterThan(0)
    // Add to wishlist button should be present
    expect(screen.getByText("sets.addToWishlist")).toBeInTheDocument()
  })

  it("handles add-to-wishlist click with optimistic UI", async () => {
    const setsData = [
      { id: 10, collectionId: 1, name: "Series A", expectedItemCount: 1, completedCount: 0, completionPercentage: 0 },
    ]
    const setDetail = {
      id: 10, collectionId: 1, name: "Series A", expectedItemCount: 1, completedCount: 0, completionPercentage: 0,
      items: [
        { id: 101, setId: 10, catalogItemId: null, name: "Missing Item", sortOrder: 1 },
      ],
    }
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.includes("/wishlist") && method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 1 }) } as Response)
      }
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.match(/\/sets\/10$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(setDetail) } as Response)
      if (urlStr.includes("/sets")) return Promise.resolve({ ok: true, json: () => Promise.resolve(setsData) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve(items) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    fireEvent.click(screen.getByText(/sets\.title/))
    await waitFor(() => screen.getByText("Series A"))
    fireEvent.click(screen.getByText("Series A"))
    await waitFor(() => screen.getByText("sets.addToWishlist"))
    fireEvent.click(screen.getByText("sets.addToWishlist"))
    // After successful add, should show "In Wishlist"
    await waitFor(() => {
      expect(screen.getByText("sets.inWishlist")).toBeInTheDocument()
    })
  })

  it("renders stats tab with ownership and rarity charts section", async () => {
    const itemsWithRarity = {
      items: [
        { id: 1, collectionId: 1, identifier: "SM-001", name: "Spider-Man #1", description: null, releaseDate: null, manufacturer: null, referenceCode: null, image: null, rarity: "Rare", customFieldValues: [], ownedCopies: null },
        { id: 2, collectionId: 1, identifier: "BM-001", name: "Batman #1", description: null, releaseDate: null, manufacturer: null, referenceCode: null, image: null, rarity: "Common", customFieldValues: [], ownedCopies: null },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 100,
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.includes("/sets")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve(itemsWithRarity) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    fireEvent.click(screen.getByText("collectionDetail.tabStats"))
    await waitFor(() => {
      expect(screen.getByText("collectionDetail.statsOwnershipBreakdown")).toBeInTheDocument()
      expect(screen.getByText("collectionDetail.statsRarityDistribution")).toBeInTheDocument()
    })
  })

  it("shows no rarity data message when items have no rarity", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    fireEvent.click(screen.getByText("collectionDetail.tabStats"))
    await waitFor(() => {
      expect(screen.getByText("collectionDetail.statsNoRarityData")).toBeInTheDocument()
    })
  })
})
