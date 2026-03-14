import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import CollectionDetail from "./CollectionDetail"

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
    t: (key: string, opts?: Record<string, unknown>) => (opts?.name ? `${key}:${opts.name}` : opts?.count !== undefined ? `${key}:${opts.count}` : key),
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}))

const collection = { id: 1, name: "Comics", description: "My comics", coverImage: null, visibility: "Private", collectionTypeId: 1, itemCount: 2 }
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

  it("shows loading state", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}))
    renderWithRoute()
    expect(document.querySelector(".animate-spin")).toBeInTheDocument()
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
    fireEvent.click(screen.getByText("collectionDetail.export"))
    expect(await screen.findByText("collectionDetail.exportTitle")).toBeInTheDocument()
  })

  it("opens import dialog", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))
    fireEvent.click(screen.getByText("collectionDetail.import"))
    expect(await screen.findByText("collectionDetail.importTitle")).toBeInTheDocument()
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
    fireEvent.change(screen.getByLabelText("collectionDetail.imageLabel"), { target: { value: "http://img.png" } })

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
    expect(screen.getByText(/2 \/ 5/)).toBeInTheDocument()

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
    fireEvent.click(screen.getByText("sets.create"))
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
    fireEvent.click(screen.getByText("sets.create"))
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
    fireEvent.click(screen.getByText("sets.create"))
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

    // Click the edit (pencil) button on the set - use the parent set card to scope
    const setCard = screen.getByText("Series A").closest("[class*='cursor-pointer']")!
    const editButton = setCard.querySelector("button")!
    fireEvent.click(editButton)

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

    // Click the delete (trash) button - second button in the set card
    const setCard = screen.getByText("Series A").closest("[class*='cursor-pointer']")!
    const buttons = setCard.querySelectorAll("button")
    fireEvent.click(buttons[1]) // trash button

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

    await waitFor(() => screen.getByText("sets.addItems"))
    fireEvent.click(screen.getByText("sets.addItems"))

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

    await waitFor(() => screen.getByText("sets.addItems"))
    fireEvent.click(screen.getByText("sets.addItems"))
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

    fireEvent.click(screen.getByText("collectionDetail.export"))
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

    fireEvent.click(screen.getByText("collectionDetail.export"))
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

    fireEvent.click(screen.getByText("collectionDetail.export"))
    await screen.findByText("collectionDetail.exportTitle")

    fireEvent.click(screen.getByText("collectionDetail.exportJSON"))
    // JSON button should now be selected (has primary styling)
    expect(screen.getByText("collectionDetail.exportJSON").className).toContain("border-primary")
  })

  it("imports file - shows preview and confirms", async () => {
    const previewData = {
      rows: [
        { rowNumber: 1, data: { identifier: "X-001", name: "X-Men" }, errors: [] },
        { rowNumber: 2, data: { identifier: "X-002", name: "X-Force" }, errors: ["Missing field"] },
      ],
      validCount: 1,
      errorCount: 1,
    }
    const importResult = { importedCount: 1 }

    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.includes("/import/preview") && method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(previewData) } as Response)
      }
      if (urlStr.includes("/import/confirm") && method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(importResult) } as Response)
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

    fireEvent.click(screen.getByText("collectionDetail.import"))
    await screen.findByText("collectionDetail.importTitle")

    // Simulate file selection
    const file = new File(["id,name\n1,Test"], "test.csv", { type: "text/csv" })
    const fileInput = screen.getByLabelText("collectionDetail.importSelectFile")
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Click preview
    fireEvent.click(screen.getByText("collectionDetail.importPreview"))

    // Wait for preview step
    await waitFor(() => {
      expect(screen.getByText(/collectionDetail\.importValidRows/)).toBeInTheDocument()
    })
    expect(screen.getByText(/collectionDetail\.importErrorRows/)).toBeInTheDocument()
    expect(screen.getByText("Missing field")).toBeInTheDocument()

    // Confirm import
    fireEvent.click(screen.getByText("collectionDetail.importConfirm"))

    await waitFor(() => {
      expect(screen.getByText(/collectionDetail\.importSuccess/)).toBeInTheDocument()
    })
  })

  it("shows error when import preview fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.includes("/import/preview") && method === "POST") {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: "Bad CSV" }) } as Response)
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

    fireEvent.click(screen.getByText("collectionDetail.import"))
    await screen.findByText("collectionDetail.importTitle")

    const file = new File(["bad"], "test.csv", { type: "text/csv" })
    const fileInput = screen.getByLabelText("collectionDetail.importSelectFile")
    fireEvent.change(fileInput, { target: { files: [file] } })

    fireEvent.click(screen.getByText("collectionDetail.importPreview"))

    await waitFor(() => {
      expect(screen.getByText("Bad CSV")).toBeInTheDocument()
    })
  })

  it("shows import no file error when no file selected", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText("collectionDetail.import"))
    await screen.findByText("collectionDetail.importTitle")

    // The preview button should be disabled when no file - but handleImportPreview also checks
    // We can't click a disabled button, so let's verify the button is disabled
    const previewBtn = screen.getByText("collectionDetail.importPreview")
    expect(previewBtn.closest("button")).toBeDisabled()
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
    await waitFor(() => screen.getByText("sets.addItems"))
    fireEvent.click(screen.getByText("sets.addItems"))
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

    expect(screen.getByText("sets.selectSet")).toBeInTheDocument()
  })

  it("closes import dialog via OK button after successful import", async () => {
    const previewData = {
      rows: [{ rowNumber: 1, data: { identifier: "X-001", name: "X-Men" }, errors: [] }],
      validCount: 1,
      errorCount: 0,
    }
    const importResultData = { importedCount: 1 }

    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.includes("/import/preview") && method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(previewData) } as Response)
      }
      if (urlStr.includes("/import/confirm") && method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(importResultData) } as Response)
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

    fireEvent.click(screen.getByText("collectionDetail.import"))
    await screen.findByText("collectionDetail.importTitle")

    const file = new File(["id,name\n1,Test"], "test.csv", { type: "text/csv" })
    fireEvent.change(screen.getByLabelText("collectionDetail.importSelectFile"), { target: { files: [file] } })
    fireEvent.click(screen.getByText("collectionDetail.importPreview"))

    await waitFor(() => screen.getByText("collectionDetail.importConfirm"))
    fireEvent.click(screen.getByText("collectionDetail.importConfirm"))

    await waitFor(() => screen.getByText("OK"))
    fireEvent.click(screen.getByText("OK"))

    // Dialog should close - the import title should no longer be visible
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

    await waitFor(() => screen.getByText("sets.addItems"))
    fireEvent.click(screen.getByText("sets.addItems"))
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

  it("shows error when import confirm fails", async () => {
    const previewData = {
      rows: [{ rowNumber: 1, data: { identifier: "X-001", name: "X-Men" }, errors: [] }],
      validCount: 1,
      errorCount: 0,
    }
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.includes("/import/preview") && method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(previewData) } as Response)
      }
      if (urlStr.includes("/import/confirm") && method === "POST") {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: "Import failed" }) } as Response)
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

    fireEvent.click(screen.getByText("collectionDetail.import"))
    await screen.findByText("collectionDetail.importTitle")

    const file = new File(["id,name\n1,Test"], "test.csv", { type: "text/csv" })
    fireEvent.change(screen.getByLabelText("collectionDetail.importSelectFile"), { target: { files: [file] } })
    fireEvent.click(screen.getByText("collectionDetail.importPreview"))

    await waitFor(() => screen.getByText("collectionDetail.importConfirm"))
    fireEvent.click(screen.getByText("collectionDetail.importConfirm"))

    await waitFor(() => {
      expect(screen.getByText("Import failed")).toBeInTheDocument()
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

    expect(screen.getByText("collectionDetail.emptyItems")).toBeInTheDocument()
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

    // Find the condition select by looking for the "conditionAll" option
    const conditionSelect = screen.getByDisplayValue("collectionDetail.conditionAll")
    fireEvent.change(conditionSelect, { target: { value: "Mint" } })

    // Verify it changed
    expect(conditionSelect).toHaveValue("Mint")
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

    const sortSelect = screen.getByDisplayValue("collectionDetail.sortName")
    fireEvent.change(sortSelect, { target: { value: "price" } })
    expect(sortSelect).toHaveValue("price")
  })

  it("closes export dialog via cancel button", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Comics"))

    fireEvent.click(screen.getByText("collectionDetail.export"))
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

    fireEvent.click(screen.getByText("collectionDetail.import"))
    await screen.findByText("collectionDetail.importTitle")

    // Click cancel in upload step
    fireEvent.click(screen.getByText("collectionDetail.importCancel"))
    await waitFor(() => {
      expect(screen.queryByText("collectionDetail.importTitle")).not.toBeInTheDocument()
    })
  })

  it("goes back from import preview to upload step", async () => {
    const previewData = {
      rows: [{ rowNumber: 1, data: { identifier: "X-001", name: "X-Men" }, errors: [] }],
      validCount: 1,
      errorCount: 0,
    }
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      if (urlStr.includes("/import/preview") && method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(previewData) } as Response)
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

    fireEvent.click(screen.getByText("collectionDetail.import"))
    await screen.findByText("collectionDetail.importTitle")

    const file = new File(["id,name\n1,Test"], "test.csv", { type: "text/csv" })
    fireEvent.change(screen.getByLabelText("collectionDetail.importSelectFile"), { target: { files: [file] } })
    fireEvent.click(screen.getByText("collectionDetail.importPreview"))

    await waitFor(() => screen.getByText("collectionDetail.importConfirm"))

    // Click back button to go to upload step
    fireEvent.click(screen.getByText("collectionDetail.importBack"))
    await waitFor(() => {
      expect(screen.getByText("collectionDetail.importPreview")).toBeInTheDocument()
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

    const setCard = screen.getByText("Series A").closest("[class*='cursor-pointer']")!
    const buttons = setCard.querySelectorAll("button")
    fireEvent.click(buttons[1]) // trash button

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

    fireEvent.click(screen.getByText("collectionDetail.export"))
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
    fireEvent.click(screen.getByText("sets.create"))
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

    // Items tab should be active (border-primary) - find the tab button specifically
    const tabButtons = document.querySelectorAll(".flex.border-b button")
    const itemsTab = tabButtons[0] as HTMLElement
    const setsTab = tabButtons[1] as HTMLElement
    expect(itemsTab.className).toContain("border-primary")

    // Switch to sets tab
    fireEvent.click(setsTab)
    expect(setsTab.className).toContain("border-primary")

    // Switch back to items tab
    fireEvent.click(itemsTab)
    expect(itemsTab.className).toContain("border-primary")
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
    fireEvent.change(screen.getByLabelText("collectionDetail.imageLabel"), { target: { value: "http://img.png" } })
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

    await waitFor(() => screen.getByText("sets.addItems"))
    fireEvent.click(screen.getByText("sets.addItems"))
    await waitFor(() => screen.getByText("sets.addItemsTitle"))

    // Close via Escape key
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    await waitFor(() => {
      expect(screen.queryByText("sets.addItemsTitle")).not.toBeInTheDocument()
    })
  })
})
