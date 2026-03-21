import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Collections from "./collections-page"

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
    t: (key: string, opts?: Record<string, unknown>) => (opts?.count !== undefined ? `${key}:${opts.count}` : key),
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
    StaggerChildren: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    staggerItemVariants: {},
    FadeIn: ({ children }: any) => <div>{children}</div>,
    PageTransition: ({ children }: any) => <div>{children}</div>,
    AnimatedNumber: ({ value }: { value: number }) => <span>{value}</span>,
    toast: mockToast,
    Select: ({ value, onValueChange, disabled, children }: any) => (
      <select value={value} onChange={(e: any) => onValueChange(e.target.value)} disabled={disabled}>{children}</select>
    ),
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
    DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
    DropdownMenuItem: ({ children, onClick, className }: any) => <button onClick={onClick} className={className}>{children}</button>,
    SortableList: ({ items, renderItem, gridClassName }: any) => (
      <div className={gridClassName}>
        {items.map((item: any, i: number) => (
          <div key={i}>{renderItem(item, { dragHandleProps: {}, isDragging: false })}</div>
        ))}
      </div>
    ),
  }
})

vi.mock("@/hooks", () => ({
  useDebounce: (value: string) => value,
}))

const collections = [
  { id: 1, name: "Comics", description: "My comics", coverImage: null, visibility: "Private", collectionTypeId: 1, collectionTypeName: "Comic Books", itemCount: 5, ownedCount: 3, completionPercentage: 60, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-03-15T12:00:00Z" },
  { id: 2, name: "Cards", description: "", coverImage: "http://img.jpg", visibility: "Private", collectionTypeId: 2, collectionTypeName: "Trading Cards", itemCount: 10, ownedCount: 0, completionPercentage: 0, createdAt: "2026-02-01T00:00:00Z", updatedAt: null },
]

const collectionTypes = [
  { id: 1, name: "Comic Books", icon: "\uD83D\uDCDA" },
  { id: 2, name: "Trading Cards", icon: "" },
]

describe("Collections", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockFetch(cols = collections, types = collectionTypes) {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      if (String(url).includes("/collection-types")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(types) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(cols) } as Response)
    })
  }

  it("shows loading state with skeleton elements", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}))
    const { container } = render(<MemoryRouter><Collections /></MemoryRouter>)
    // Loading state renders SkeletonRect components which have skeleton-pulse class
    const skeletons = container.querySelectorAll(".skeleton-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("renders collection cards", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("Comics")).toBeInTheDocument()
      expect(screen.getByText("Cards")).toBeInTheDocument()
    })
  })

  it("shows empty state with emptyStates key", async () => {
    mockFetch([])
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("emptyStates.collections.title")).toBeInTheDocument()
    })
    expect(screen.getByText("emptyStates.collections.description")).toBeInTheDocument()
  })

  it("navigates to collection on card click", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))
    fireEvent.click(screen.getByText("Comics"))
    expect(mockNavigate).toHaveBeenCalledWith("/collections/1")
  })

  it("opens create dialog", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("collections.title"))
    fireEvent.click(screen.getByText("collections.create"))
    await waitFor(() => {
      expect(screen.getByText("collections.createTitle")).toBeInTheDocument()
    })
  })

  it("validates name required on submit", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("collections.title"))
    fireEvent.click(screen.getByText("collections.create"))
    await waitFor(() => screen.getByText("collections.createTitle"))
    // Submit without name
    fireEvent.click(screen.getAllByText("collections.create").pop()!)
    await waitFor(() => {
      expect(screen.getByText("collections.nameRequired")).toBeInTheDocument()
    })
  })

  it("validates type required on submit", async () => {
    mockFetch([], []) // no types
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("emptyStates.collections.title"))
    // Click the action button in empty state to open create dialog
    fireEvent.click(screen.getByText("emptyStates.collections.action"))
    await waitFor(() => screen.getByText("collections.createTitle"))
    // Enter a name but no type (no types available, formTypeId stays "")
    fireEvent.change(screen.getByLabelText("collections.nameLabel"), { target: { value: "Test" } })
    fireEvent.click(screen.getAllByText("collections.create").pop()!)
    await waitFor(() => {
      expect(screen.getByText("collections.typeRequired")).toBeInTheDocument()
    })
  })

  it("opens edit dialog via quick action button", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))
    const editButtons = screen.getAllByLabelText("collections.edit")
    fireEvent.click(editButtons[0])
    await waitFor(() => {
      expect(screen.getByText("collections.editTitle")).toBeInTheDocument()
    })
  })

  it("opens and confirms delete dialog", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const deleteButtons = screen.getAllByText("collections.delete")
    fireEvent.click(deleteButtons[0])
    await waitFor(() => {
      expect(screen.getByText("collections.deleteConfirm")).toBeInTheDocument()
    })
  })

  it("shows error via toast on fetch failure", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      if (String(url).includes("/collection-types")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      return Promise.resolve({ ok: false } as Response)
    })
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("collections.fetchError")
    })
  })

  it("creates collection successfully", async () => {
    let callCount = 0
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionTypes) } as Response)
      }
      if (opts && (opts as RequestInit).method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 3 }) } as Response)
      }
      callCount++
      return Promise.resolve({ ok: true, json: () => Promise.resolve(callCount > 1 ? [...collections, { id: 3, name: "New", description: "", coverImage: null, visibility: "Private", collectionTypeId: 1, collectionTypeName: "Comic Books", itemCount: 0 }] : collections) } as Response)
    })

    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("collections.title"))
    fireEvent.click(screen.getByText("collections.create"))
    await waitFor(() => screen.getByText("collections.createTitle"))

    fireEvent.change(screen.getByLabelText("collections.nameLabel"), { target: { value: "New" } })
    // Select type via the mocked native select
    const typeSelects = screen.getAllByRole("combobox")
    const formTypeSelect = typeSelects.find((el) => {
      const options = el.querySelectorAll("option")
      return Array.from(options).some((o) => o.textContent?.includes("Comic Books"))
    })!
    fireEvent.change(formTypeSelect, { target: { value: "1" } })

    fireEvent.click(screen.getAllByText("collections.create").pop()!)
    await waitFor(() => {
      expect(screen.queryByText("collections.createTitle")).not.toBeInTheDocument()
    })
  })

  it("renders quick action buttons for each collection", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const editButtons = screen.getAllByLabelText("collections.edit")
    const openButtons = screen.getAllByLabelText("collections.view")
    const menuButtons = screen.getAllByLabelText("collections.actions")
    expect(editButtons).toHaveLength(2)
    expect(openButtons).toHaveLength(2)
    expect(menuButtons).toHaveLength(2)
  })

  it("renders action buttons for each collection card", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const actionButtons = screen.getAllByLabelText("collections.actions")
    expect(actionButtons).toHaveLength(2)
  })

  it("creates collection with cover image upload", async () => {
    const fetchCalls: string[] = []
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      fetchCalls.push(urlStr)
      if (urlStr.includes("/collection-types")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionTypes) } as Response)
      }
      if (opts && (opts as RequestInit).method === "POST" && urlStr.includes("/cover")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      if (opts && (opts as RequestInit).method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 3 }) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
    })

    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("collections.title"))
    fireEvent.click(screen.getByText("collections.create"))
    await waitFor(() => screen.getByText("collections.createTitle"))

    fireEvent.change(screen.getByLabelText("collections.nameLabel"), { target: { value: "New Col" } })

    // Select type
    const typeSelects = screen.getAllByRole("combobox")
    const formTypeSelect = typeSelects.find((el) => {
      const options = el.querySelectorAll("option")
      return Array.from(options).some((o) => o.textContent?.includes("Comic Books"))
    })!
    fireEvent.change(formTypeSelect, { target: { value: "1" } })

    // Add a cover file via the hidden file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["img"], "cover.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    fireEvent.click(screen.getAllByText("collections.create").pop()!)
    await waitFor(() => {
      expect(screen.queryByText("collections.createTitle")).not.toBeInTheDocument()
    })
    expect(fetchCalls.some(u => u.includes("/cover"))).toBe(true)
  })

  it("shows error when create fails with message", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionTypes) } as Response)
      }
      if (opts && (opts as RequestInit).method === "POST") {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: "Name taken" }) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
    })

    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("collections.title"))
    fireEvent.click(screen.getByText("collections.create"))
    await waitFor(() => screen.getByText("collections.createTitle"))

    fireEvent.change(screen.getByLabelText("collections.nameLabel"), { target: { value: "Dup" } })
    const typeSelects = screen.getAllByRole("combobox")
    const formTypeSelect = typeSelects.find((el) => {
      const options = el.querySelectorAll("option")
      return Array.from(options).some((o) => o.textContent?.includes("Comic Books"))
    })!
    fireEvent.change(formTypeSelect, { target: { value: "1" } })

    fireEvent.click(screen.getAllByText("collections.create").pop()!)
    expect(await screen.findByText("Name taken")).toBeInTheDocument()
  })

  it("shows generic error when create fails and json parsing fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionTypes) } as Response)
      }
      if (opts && (opts as RequestInit).method === "POST") {
        return Promise.resolve({ ok: false, json: () => Promise.reject(new Error("bad")) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
    })

    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("collections.title"))
    fireEvent.click(screen.getByText("collections.create"))
    await waitFor(() => screen.getByText("collections.createTitle"))

    fireEvent.change(screen.getByLabelText("collections.nameLabel"), { target: { value: "X" } })
    const typeSelects = screen.getAllByRole("combobox")
    const formTypeSelect = typeSelects.find((el) => {
      const options = el.querySelectorAll("option")
      return Array.from(options).some((o) => o.textContent?.includes("Comic Books"))
    })!
    fireEvent.change(formTypeSelect, { target: { value: "1" } })

    fireEvent.click(screen.getAllByText("collections.create").pop()!)
    expect(await screen.findByText("collections.saveFailed")).toBeInTheDocument()
  })

  it("deletes collection successfully", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionTypes) } as Response)
      }
      if (opts && (opts as RequestInit).method === "DELETE") {
        return Promise.resolve({ ok: true } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
    })

    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const deleteButtons = screen.getAllByText("collections.delete")
    fireEvent.click(deleteButtons[0])
    await screen.findByText("collections.deleteConfirm")

    fireEvent.click(screen.getAllByText("collections.delete").pop()!)
    await waitFor(() => {
      expect(screen.queryByText("collections.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("shows error via toast when delete fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionTypes) } as Response)
      }
      if (opts && (opts as RequestInit).method === "DELETE") {
        return Promise.resolve({ ok: false } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
    })

    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const deleteButtons = screen.getAllByText("collections.delete")
    fireEvent.click(deleteButtons[0])
    await screen.findByText("collections.deleteConfirm")

    fireEvent.click(screen.getAllByText("collections.delete").pop()!)
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("collections.deleteFailed")
    })
  })

  it("edits collection successfully via PUT", async () => {
    let putCalled = false
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionTypes) } as Response)
      }
      if (opts && (opts as RequestInit).method === "PUT") {
        putCalled = true
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
    })

    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const editButtons = screen.getAllByLabelText("collections.edit")
    fireEvent.click(editButtons[0])
    await waitFor(() => screen.getByText("collections.editTitle"))

    // Verify save button text (editingId branch)
    expect(screen.getByText("collections.save")).toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue("Comics"), { target: { value: "Updated Comics" } })
    fireEvent.click(screen.getByText("collections.save"))

    await waitFor(() => {
      expect(putCalled).toBe(true)
    })
  })

  it("closes create dialog via cancel button", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("collections.title"))
    fireEvent.click(screen.getByText("collections.create"))
    await waitFor(() => screen.getByText("collections.createTitle"))

    fireEvent.click(screen.getByText("collections.cancel"))
    await waitFor(() => {
      expect(screen.queryByText("collections.createTitle")).not.toBeInTheDocument()
    })
  })

  it("closes delete dialog via Escape key (triggers onOpenChange)", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const deleteButtons = screen.getAllByText("collections.delete")
    fireEvent.click(deleteButtons[0])
    await screen.findByText("collections.deleteConfirm")

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    await waitFor(() => {
      expect(screen.queryByText("collections.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("closes delete dialog via cancel button", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const deleteButtons = screen.getAllByText("collections.delete")
    fireEvent.click(deleteButtons[0])
    await screen.findByText("collections.deleteConfirm")

    fireEvent.click(screen.getByText("collections.cancel"))
    await waitFor(() => {
      expect(screen.queryByText("collections.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("changes description field in create dialog", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("collections.title"))
    fireEvent.click(screen.getByText("collections.create"))
    await waitFor(() => screen.getByText("collections.createTitle"))

    const descInput = screen.getByLabelText("collections.descriptionLabel")
    fireEvent.change(descInput, { target: { value: "New description" } })
    expect(descInput).toHaveValue("New description")
  })

  it("shows cover image when collection has one", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Cards"))
    // Cards collection has coverImage: "http://img.jpg"
    const img = screen.getByAltText("Cards")
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute("src", "http://img.jpg")
  })

  it("handles cover file input with file and null", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("collections.title"))
    fireEvent.click(screen.getByText("collections.create"))
    await waitFor(() => screen.getByText("collections.createTitle"))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    // Test selecting a file
    const file = new File(["img"], "cover.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })
    // The file name should appear in the dropzone
    expect(screen.getByText("cover.png")).toBeInTheDocument()
    // Test clearing (null branch via ?.[0] ?? null)
    fireEvent.change(fileInput, { target: { files: null } })
  })

  it("shows metadata line with item count and completion on cover card", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))
    // Comics: 5 items, 60% complete, has updatedAt — all joined with " · "
    const metadataEl = screen.getByText((content) => content.includes("collections.itemCount:5") && content.includes("collections.complete"))
    expect(metadataEl).toBeInTheDocument()
  })

  it("shows toast on successful create", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionTypes) } as Response)
      }
      if (opts && (opts as RequestInit).method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 3 }) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
    })

    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("collections.title"))
    fireEvent.click(screen.getByText("collections.create"))
    await waitFor(() => screen.getByText("collections.createTitle"))

    fireEvent.change(screen.getByLabelText("collections.nameLabel"), { target: { value: "New" } })
    const typeSelects = screen.getAllByRole("combobox")
    const formTypeSelect = typeSelects.find((el) => {
      const options = el.querySelectorAll("option")
      return Array.from(options).some((o) => o.textContent?.includes("Comic Books"))
    })!
    fireEvent.change(formTypeSelect, { target: { value: "1" } })

    fireEvent.click(screen.getAllByText("collections.create").pop()!)
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("collections.createSuccess")
    })
  })

  it("shows toast on successful delete", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      if (urlStr.includes("/collection-types")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionTypes) } as Response)
      }
      if (opts && (opts as RequestInit).method === "DELETE") {
        return Promise.resolve({ ok: true } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
    })

    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const deleteButtons = screen.getAllByText("collections.delete")
    fireEvent.click(deleteButtons[0])
    await screen.findByText("collections.deleteConfirm")

    fireEvent.click(screen.getAllByText("collections.delete").pop()!)
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("collections.deleteSuccess")
    })
  })

  it("sort dropdown triggers API call with query params", async () => {
    const fetchUrls: string[] = []
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      fetchUrls.push(String(url))
      const urlStr = String(url)
      if (urlStr.includes("/collection-types")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionTypes) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
    })

    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Find the sort select (has sortOrder:asc as default value) and change to name:asc
    const sortSelects = screen.getAllByRole("combobox")
    const sortSelect = sortSelects.find((el) => {
      const options = el.querySelectorAll("option")
      return Array.from(options).some((o) => o.getAttribute("value") === "name:asc")
    })!
    fireEvent.change(sortSelect, { target: { value: "name:asc" } })

    await waitFor(() => {
      const lastCollectionsFetch = fetchUrls.filter(u => u.includes("/api/collections") && !u.includes("/collection-types")).pop()
      expect(lastCollectionsFetch).toContain("sortBy=name")
      expect(lastCollectionsFetch).toContain("sortDir=asc")
    })
  })

  it("sort preference persisted to localStorage", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const sortSelects = screen.getAllByRole("combobox")
    const sortSelect = sortSelects.find((el) => {
      const options = el.querySelectorAll("option")
      return Array.from(options).some((o) => o.getAttribute("value") === "updatedAt:desc")
    })!
    fireEvent.change(sortSelect, { target: { value: "updatedAt:desc" } })

    expect(localStorage.getItem("collections-sortBy")).toBe("updatedAt")
    expect(localStorage.getItem("collections-sortDir")).toBe("desc")
  })

  it("mobile filter toggle shows and hides filters", async () => {
    mockFetch()
    const { container } = render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Find the filters toggle button
    const filtersButton = screen.getByLabelText("collections.toolbar.filters")
    expect(filtersButton).toBeInTheDocument()

    // Initially collapsed (grid-rows-[0fr])
    const filterRow = container.querySelector(".grid-rows-\\[0fr\\]")
    expect(filterRow).toBeInTheDocument()

    // Click to open
    fireEvent.click(filtersButton)

    // Now expanded (grid-rows-[1fr])
    const expandedRow = container.querySelector(".grid-rows-\\[1fr\\]")
    expect(expandedRow).toBeInTheDocument()
  })

  it("grid/list view toggle switches view and persists to localStorage", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Default is grid view - toggle button shows list icon
    const toggleButton = screen.getByLabelText("collections.viewList")
    expect(toggleButton).toBeInTheDocument()

    // Click to switch to list view
    fireEvent.click(toggleButton)
    expect(localStorage.getItem("collections-view-mode")).toBe("list")

    // Now shows grid icon button (to switch back)
    expect(screen.getByLabelText("collections.viewGrid")).toBeInTheDocument()

    // List view renders DataTable with column headers
    expect(screen.getByText("collections.nameLabel")).toBeInTheDocument()
    expect(screen.getByText("collections.typeLabel")).toBeInTheDocument()
  })

  it("shows completion percentage on cover card", async () => {
    // Ensure grid view via localStorage
    localStorage.setItem("collections-view-mode", "grid")
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Comics has itemCount: 5 and completionPercentage: 60 — metadata includes "collections.complete" (t mock returns key)
    const metadataEl = screen.getByText((content) => content.includes("collections.itemCount:5") && content.includes("collections.complete"))
    expect(metadataEl).toBeInTheDocument()
    // Cards has itemCount: 10 but completionPercentage: 0, still shows complete since itemCount > 0
    const cardsMetadata = screen.getByText((content) => content.includes("collections.itemCount:10") && content.includes("collections.complete"))
    expect(cardsMetadata).toBeInTheDocument()
  })

  it("filters collections by search query", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))
    expect(screen.getByText("Cards")).toBeInTheDocument()

    // Type in search box
    const searchInput = screen.getByPlaceholderText("collections.searchPlaceholder")
    fireEvent.change(searchInput, { target: { value: "Comics" } })

    // Cards should be filtered out
    expect(screen.getByText("Comics")).toBeInTheDocument()
    expect(screen.queryByText("Cards")).not.toBeInTheDocument()
  })

  it("filters collections by type", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Find the type filter select (has "all" as value)
    const typeSelects = screen.getAllByRole("combobox")
    const typeFilter = typeSelects.find((el) => {
      const options = el.querySelectorAll("option")
      return Array.from(options).some((o) => o.textContent?.includes("collections.allTypes"))
    })!
    fireEvent.change(typeFilter, { target: { value: "1" } })

    // Only Comics (typeId: 1) should be visible
    expect(screen.getByText("Comics")).toBeInTheDocument()
    expect(screen.queryByText("Cards")).not.toBeInTheDocument()
  })

  it("shows no results message when filter matches nothing", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const searchInput = screen.getByPlaceholderText("collections.searchPlaceholder")
    fireEvent.change(searchInput, { target: { value: "nonexistent" } })

    expect(screen.getByText("collections.noResults")).toBeInTheDocument()
  })
})
