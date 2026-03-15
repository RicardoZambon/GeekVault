import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Collections from "./Collections"

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

const collections = [
  { id: 1, name: "Comics", description: "My comics", coverImage: null, visibility: "Private", collectionTypeId: 1, collectionTypeName: "Comic Books", itemCount: 5 },
  { id: 2, name: "Cards", description: "", coverImage: "http://img.jpg", visibility: "Private", collectionTypeId: 2, collectionTypeName: "Trading Cards", itemCount: 10 },
]

const collectionTypes = [
  { id: 1, name: "Comic Books", icon: "📚" },
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

  it("shows loading spinner", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}))
    render(<MemoryRouter><Collections /></MemoryRouter>)
    expect(document.querySelector(".animate-spin")).toBeInTheDocument()
  })

  it("renders collection cards", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("Comics")).toBeInTheDocument()
      expect(screen.getByText("Cards")).toBeInTheDocument()
    })
  })

  it("shows empty state", async () => {
    mockFetch([])
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("collections.empty")).toBeInTheDocument()
    })
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
    await waitFor(() => screen.getByText("collections.empty"))
    fireEvent.click(screen.getByText("collections.create"))
    await waitFor(() => screen.getByText("collections.createTitle"))
    // Enter a name but no type
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
    // Click the menu button
    const menuButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(menuButtons[0])
    await waitFor(() => screen.getByText("collections.edit"))
    fireEvent.click(screen.getByText("collections.edit"))
    await waitFor(() => {
      expect(screen.getByText("collections.editTitle")).toBeInTheDocument()
    })
  })

  it("opens and confirms delete dialog", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const menuButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(menuButtons[0])
    await waitFor(() => screen.getByText("collections.delete"))
    fireEvent.click(screen.getByText("collections.delete"))
    await waitFor(() => {
      expect(screen.getByText("collections.deleteConfirm")).toBeInTheDocument()
    })
  })

  it("shows error on fetch failure", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      if (String(url).includes("/collection-types")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      return Promise.resolve({ ok: false } as Response)
    })
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("collections.fetchError")).toBeInTheDocument()
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
    // Select type
    const typeSelect = screen.getByLabelText("collections.typeLabel")
    fireEvent.change(typeSelect, { target: { value: "1" } })

    fireEvent.click(screen.getAllByText("collections.create").pop()!)
    await waitFor(() => {
      expect(screen.queryByText("collections.createTitle")).not.toBeInTheDocument()
    })
  })

  it("closes menu on outside click", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const menuButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(menuButtons[0])
    await waitFor(() => screen.getByText("collections.edit"))

    // Click outside
    fireEvent.mouseDown(document.body)
    await waitFor(() => {
      expect(screen.queryByText("collections.edit")).not.toBeInTheDocument()
    })
  })

  it("toggles menu open and closed", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const menuButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(menuButtons[0])
    await waitFor(() => screen.getByText("collections.edit"))

    // Click same menu button to close
    fireEvent.click(menuButtons[0])
    await waitFor(() => {
      expect(screen.queryByText("collections.edit")).not.toBeInTheDocument()
    })
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
    fireEvent.change(screen.getByLabelText("collections.typeLabel"), { target: { value: "1" } })

    // Add a cover file
    const fileInput = screen.getByLabelText("collections.coverLabel")
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
    fireEvent.change(screen.getByLabelText("collections.typeLabel"), { target: { value: "1" } })

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
    fireEvent.change(screen.getByLabelText("collections.typeLabel"), { target: { value: "1" } })

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

    const menuButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(menuButtons[0])
    await waitFor(() => screen.getByText("collections.delete"))
    fireEvent.click(screen.getByText("collections.delete"))
    await screen.findByText("collections.deleteConfirm")

    fireEvent.click(screen.getAllByText("collections.delete").pop()!)
    await waitFor(() => {
      expect(screen.queryByText("collections.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("shows error when delete fails", async () => {
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

    const menuButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(menuButtons[0])
    await waitFor(() => screen.getByText("collections.delete"))
    fireEvent.click(screen.getByText("collections.delete"))
    await screen.findByText("collections.deleteConfirm")

    fireEvent.click(screen.getAllByText("collections.delete").pop()!)
    await waitFor(() => {
      expect(screen.getByText("collections.deleteFailed")).toBeInTheDocument()
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

    // Open menu and click edit
    const menuButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(menuButtons[0])
    await waitFor(() => screen.getByText("collections.edit"))
    fireEvent.click(screen.getByText("collections.edit"))
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

    const menuButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(menuButtons[0])
    await waitFor(() => screen.getByText("collections.delete"))
    fireEvent.click(screen.getByText("collections.delete"))
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

    const menuButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(menuButtons[0])
    await waitFor(() => screen.getByText("collections.delete"))
    fireEvent.click(screen.getByText("collections.delete"))
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

    const fileInput = screen.getByLabelText("collections.coverLabel")
    // Test selecting a file
    const file = new File(["img"], "cover.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })
    // Test clearing (null branch via ?.[0] ?? null)
    fireEvent.change(fileInput, { target: { files: null } })
  })

  it("resets type to empty when selecting blank option", async () => {
    mockFetch()
    render(<MemoryRouter><Collections /></MemoryRouter>)
    await waitFor(() => screen.getByText("collections.title"))
    fireEvent.click(screen.getByText("collections.create"))
    await waitFor(() => screen.getByText("collections.createTitle"))

    const typeSelect = screen.getByLabelText("collections.typeLabel")
    // First select a valid type
    fireEvent.change(typeSelect, { target: { value: "1" } })
    // Then reset to empty
    fireEvent.change(typeSelect, { target: { value: "" } })
    expect(typeSelect).toHaveValue("")
  })
})
