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
  }
})

vi.mock("@/hooks", () => ({
  useDebounce: (value: string) => value,
}))

const collections = [
  { id: 1, name: "Comics", description: "My comics", coverImage: null, visibility: "Private", collectionTypeId: 1, collectionTypeName: "Comic Books", itemCount: 5 },
  { id: 2, name: "Cards", description: "", coverImage: "http://img.jpg", visibility: "Private", collectionTypeId: 2, collectionTypeName: "Trading Cards", itemCount: 10 },
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
    // Loading state renders SkeletonRect components which have animate-pulse class
    const skeletons = container.querySelectorAll(".animate-pulse")
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

  it("opens menu and edit dialog", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))
    const editButtons = screen.getAllByText("collections.edit")
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

  it("renders dropdown menu actions for each collection", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const editButtons = screen.getAllByText("collections.edit")
    const deleteButtons = screen.getAllByText("collections.delete")
    expect(editButtons).toHaveLength(2)
    expect(deleteButtons).toHaveLength(2)
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

    const editButtons = screen.getAllByText("collections.edit")
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

  it("shows collection type name as badge and item count", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))
    expect(screen.getByText("Comic Books")).toBeInTheDocument()
    expect(screen.getByText("collections.itemCount:5")).toBeInTheDocument()
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
})
