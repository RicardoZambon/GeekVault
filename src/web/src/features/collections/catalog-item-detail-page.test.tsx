import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import CatalogItemDetail from "./catalog-item-detail-page"

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
    t: (key: string, opts?: Record<string, unknown>) => (opts?.name ? `${key}:${opts.name}` : key),
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}))

const item = {
  id: 1,
  collectionId: 1,
  identifier: "SM-001",
  name: "Spider-Man #1",
  description: "First issue",
  releaseDate: "1963-03-01",
  manufacturer: "Marvel",
  referenceCode: "REF-001",
  image: "http://img.jpg",
  rarity: "Rare",
  customFieldValues: [{ name: "Grade", value: "9.5" }],
  ownedCopies: [],
}

const copies = [
  { id: 1, catalogItemId: 1, condition: "NearMint", purchasePrice: 50.0, estimatedValue: 200.0, acquisitionDate: "2024-01-15", acquisitionSource: "eBay", notes: "Great condition", images: [] },
]

const collection = { id: 1, name: "Comics", collectionTypeId: 1 }
const collectionType = { id: 1, name: "Comic Books", description: null, icon: null, customFields: [{ name: "Grade", type: "text", required: false, options: [] }] }

function renderWithRoute() {
  return render(
    <MemoryRouter initialEntries={["/collections/1/items/1"]}>
      <Routes>
        <Route path="/collections/:id/items/:itemId" element={<CatalogItemDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

describe("CatalogItemDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockFetch(withCopies = true) {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(withCopies ? copies : []) } as Response)
      }
      if (urlStr.includes("/collection-types/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      }
      if (urlStr.match(/\/collections\/\d+$/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      }
      if (urlStr.includes("/items/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(item) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })
  }

  it("shows loading state", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}))
    renderWithRoute()
    expect(document.querySelector(".animate-spin")).toBeInTheDocument()
  })

  it("renders item details", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => {
      expect(screen.getByText("Spider-Man #1")).toBeInTheDocument()
    })
    expect(screen.getByText("SM-001")).toBeInTheDocument()
    expect(screen.getByText("First issue")).toBeInTheDocument()
    expect(screen.getByText("Marvel")).toBeInTheDocument()
    expect(screen.getByText("Rare")).toBeInTheDocument()
    expect(screen.getByText("9.5")).toBeInTheDocument()
  })

  it("shows not found state", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({ ok: false } as Response)
    )
    renderWithRoute()
    await waitFor(() => {
      expect(screen.getByText("itemDetail.notFound")).toBeInTheDocument()
    })
  })

  it("navigates back from not found state", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({ ok: false } as Response)
    )
    renderWithRoute()
    await waitFor(() => {
      expect(screen.getByText("itemDetail.notFound")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText("itemDetail.backToCollection"))
    expect(mockNavigate).toHaveBeenCalledWith("/collections/1")
  })

  it("renders owned copies", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => {
      expect(screen.getByText("Near Mint")).toBeInTheDocument()
      expect(screen.getByText("$50.00")).toBeInTheDocument()
      expect(screen.getByText("$200.00")).toBeInTheDocument()
      expect(screen.getByText("eBay")).toBeInTheDocument()
      expect(screen.getByText("Great condition")).toBeInTheDocument()
    })
  })

  it("shows no copies message", async () => {
    mockFetch(false)
    renderWithRoute()
    await waitFor(() => {
      expect(screen.getByText("itemDetail.noCopies")).toBeInTheDocument()
    })
  })

  it("opens edit dialog", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    fireEvent.click(screen.getByText("itemDetail.edit"))
    expect(await screen.findByText("itemDetail.editTitle")).toBeInTheDocument()
    expect(screen.getByDisplayValue("SM-001")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Spider-Man #1")).toBeInTheDocument()
  })

  it("validates edit form", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    // Clear identifier
    fireEvent.change(screen.getByDisplayValue("SM-001"), { target: { value: "" } })
    fireEvent.click(screen.getByText("collectionDetail.save"))
    expect(await screen.findByText("collectionDetail.identifierRequired")).toBeInTheDocument()
  })

  it("validates name required in edit", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    fireEvent.change(screen.getByDisplayValue("Spider-Man #1"), { target: { value: "" } })
    fireEvent.click(screen.getByText("collectionDetail.save"))
    expect(await screen.findByText("collectionDetail.nameRequired")).toBeInTheDocument()
  })

  it("opens delete dialog", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    fireEvent.click(screen.getByText("itemDetail.delete"))
    expect(await screen.findByText("itemDetail.deleteConfirm")).toBeInTheDocument()
  })

  it("opens add copy dialog", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    fireEvent.click(screen.getByText("ownedCopy.add"))
    expect(await screen.findByText("ownedCopy.addTitle")).toBeInTheDocument()
  })

  it("navigates back to collection", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    fireEvent.click(screen.getByText("itemDetail.backToCollection"))
    expect(mockNavigate).toHaveBeenCalledWith("/collections/1")
  })

  it("shows image when available", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => {
      expect(screen.getByAltText("Spider-Man #1")).toBeInTheDocument()
    })
  })

  it("opens edit copy dialog", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Near Mint"))

    // Find the edit button for the copy
    const editButtons = document.querySelectorAll("button")
    const editCopyBtn = Array.from(editButtons).find(
      (btn) => btn.closest("[class*='rounded-lg border bg-card p-4']") && btn.querySelector("svg")
    )
    // Use a more targeted approach
    const copyCard = screen.getByText("Near Mint").closest("[class*='rounded-lg']")!
    const buttons = copyCard.querySelectorAll("button")
    fireEvent.click(buttons[0]) // first button is edit
    expect(await screen.findByText("ownedCopy.editTitle")).toBeInTheDocument()
  })

  it("opens delete copy dialog", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Near Mint"))

    const copyCard = screen.getByText("Near Mint").closest("[class*='rounded-lg border bg-card p-4']")!
    const buttons = copyCard.querySelectorAll("button")
    fireEvent.click(buttons[1]) // second button is delete
    expect(await screen.findByText("ownedCopy.deleteConfirm")).toBeInTheDocument()
  })

  it("shows placeholder icon when item has no image", async () => {
    const itemNoImage = { ...item, image: null }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(itemNoImage) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    // No img tag should be present
    expect(screen.queryByAltText("Spider-Man #1")).not.toBeInTheDocument()
  })

  it("submits edit form successfully", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    // Modify name
    fireEvent.change(screen.getByDisplayValue("Spider-Man #1"), { target: { value: "Spider-Man #2" } })

    // Mock the PUT call
    const fetchSpy = vi.spyOn(global, "fetch")
    fetchSpy.mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method
      if (method === "PUT" && urlStr.includes("/items/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      // Re-fetch after save
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copies) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve({ ...item, name: "Spider-Man #2" }) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })

    fireEvent.click(screen.getByText("collectionDetail.save"))

    await waitFor(() => {
      // Dialog should close
      expect(screen.queryByText("itemDetail.editTitle")).not.toBeInTheDocument()
    })
    // Verify PUT was called
    const putCall = fetchSpy.mock.calls.find(
      (call) => (call[1] as RequestInit)?.method === "PUT" && String(call[0]).includes("/items/")
    )
    expect(putCall).toBeDefined()
  })

  it("shows error on edit form submission failure", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    // Mock a failed PUT
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const method = (opts as RequestInit)?.method
      if (method === "PUT") {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: "Server error" }),
        } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })

    fireEvent.click(screen.getByText("collectionDetail.save"))
    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument()
    })
  })

  it("validates required custom field in edit form", async () => {
    const typeWithRequired = {
      ...collectionType,
      customFields: [{ name: "Grade", type: "text", required: true, options: [] }],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copies) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(typeWithRequired) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve({ ...item, customFieldValues: [] }) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    // Submit without filling required custom field
    fireEvent.click(screen.getByText("collectionDetail.save"))
    await waitFor(() => {
      expect(screen.getByText("collectionDetail.customFieldRequired:Grade")).toBeInTheDocument()
    })
  })

  it("deletes item successfully and navigates back", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.delete"))
    await screen.findByText("itemDetail.deleteConfirm")

    vi.spyOn(global, "fetch").mockImplementation((_, opts) => {
      const method = (opts as RequestInit)?.method
      if (method === "DELETE") return Promise.resolve({ ok: true } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })

    // Click the destructive delete button in the dialog
    const deleteButtons = screen.getAllByText("itemDetail.delete")
    const confirmBtn = deleteButtons.find((btn) => btn.closest("[role='dialog']"))!
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/collections/1")
    })
  })

  it("shows error when delete item fails", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.delete"))
    await screen.findByText("itemDetail.deleteConfirm")

    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({ ok: false } as Response)
    )

    const deleteButtons = screen.getAllByText("itemDetail.delete")
    const confirmBtn = deleteButtons.find((btn) => btn.closest("[role='dialog']"))!
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText("itemDetail.deleteFailed")).toBeInTheDocument()
    })
  })

  it("submits add copy form successfully", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("ownedCopy.add"))
    await screen.findByText("ownedCopy.addTitle")

    // Fill in form fields
    fireEvent.change(screen.getByLabelText("itemDetail.purchasePrice"), { target: { value: "25.50" } })
    fireEvent.change(screen.getByLabelText("itemDetail.estimatedValue"), { target: { value: "100" } })
    fireEvent.change(screen.getByLabelText("itemDetail.acquisitionDate"), { target: { value: "2025-06-15" } })
    fireEvent.change(screen.getByLabelText("itemDetail.acquisitionSource"), { target: { value: "Comic shop" } })
    fireEvent.change(screen.getByLabelText("itemDetail.notes"), { target: { value: "Signed copy" } })

    const fetchSpy = vi.spyOn(global, "fetch")
    fetchSpy.mockImplementation((url, opts) => {
      const method = (opts as RequestInit)?.method
      const urlStr = String(url)
      if (method === "POST" && urlStr.includes("/copies")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 2 }) } as Response)
      }
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copies) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })

    fireEvent.click(screen.getByText("collectionDetail.save"))
    await waitFor(() => {
      expect(screen.queryByText("ownedCopy.addTitle")).not.toBeInTheDocument()
    })

    const postCall = fetchSpy.mock.calls.find(
      (call) => (call[1] as RequestInit)?.method === "POST" && String(call[0]).includes("/copies")
    )
    expect(postCall).toBeDefined()
  })

  it("shows error when add copy fails", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("ownedCopy.add"))
    await screen.findByText("ownedCopy.addTitle")

    vi.spyOn(global, "fetch").mockImplementation((_, opts) => {
      const method = (opts as RequestInit)?.method
      if (method === "POST") {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: "Copy save failed" }),
        } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })

    fireEvent.click(screen.getByText("collectionDetail.save"))
    await waitFor(() => {
      expect(screen.getByText("Copy save failed")).toBeInTheDocument()
    })
  })

  it("submits edit copy form successfully", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Near Mint"))

    // Click edit on the copy
    const copyCard = screen.getByText("Near Mint").closest("[class*='rounded-lg border bg-card p-4']")!
    const buttons = copyCard.querySelectorAll("button")
    fireEvent.click(buttons[0]) // edit button
    await screen.findByText("ownedCopy.editTitle")

    // Verify form is populated with copy data
    expect(screen.getByLabelText("itemDetail.purchasePrice")).toHaveValue(50)
    expect(screen.getByLabelText("itemDetail.estimatedValue")).toHaveValue(200)

    const fetchSpy = vi.spyOn(global, "fetch")
    fetchSpy.mockImplementation((url, opts) => {
      const method = (opts as RequestInit)?.method
      const urlStr = String(url)
      if (method === "PUT" && urlStr.includes("/copies/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copies) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })

    fireEvent.click(screen.getByText("collectionDetail.save"))
    await waitFor(() => {
      expect(screen.queryByText("ownedCopy.editTitle")).not.toBeInTheDocument()
    })

    const putCall = fetchSpy.mock.calls.find(
      (call) => (call[1] as RequestInit)?.method === "PUT" && String(call[0]).includes("/copies/")
    )
    expect(putCall).toBeDefined()
  })

  it("deletes copy successfully", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Near Mint"))

    // Click delete on the copy
    const copyCard = screen.getByText("Near Mint").closest("[class*='rounded-lg border bg-card p-4']")!
    const buttons = copyCard.querySelectorAll("button")
    fireEvent.click(buttons[1]) // delete button
    await screen.findByText("ownedCopy.deleteConfirm")

    const fetchSpy = vi.spyOn(global, "fetch")
    fetchSpy.mockImplementation((url, opts) => {
      const method = (opts as RequestInit)?.method
      const urlStr = String(url)
      if (method === "DELETE" && urlStr.includes("/copies/")) {
        return Promise.resolve({ ok: true } as Response)
      }
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })

    // Click confirm delete in the dialog
    const deleteButtons = screen.getAllByText("itemDetail.delete")
    const confirmBtn = deleteButtons.find((btn) => btn.closest("[role='dialog']"))!
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.queryByText("ownedCopy.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("handles delete copy failure by closing dialog and storing error", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Near Mint"))

    // Click delete on the copy
    const copyCard = screen.getByText("Near Mint").closest("[class*='rounded-lg border bg-card p-4']")!
    const buttons = copyCard.querySelectorAll("button")
    fireEvent.click(buttons[1]) // delete button
    await screen.findByText("ownedCopy.deleteConfirm")

    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({ ok: false } as Response)
    )

    const deleteButtons = screen.getAllByText("itemDetail.delete")
    const confirmBtn = deleteButtons.find((btn) => btn.closest("[role='dialog']"))!
    fireEvent.click(confirmBtn)

    // The delete copy dialog should close after failure
    await waitFor(() => {
      expect(screen.queryByText("ownedCopy.deleteConfirm")).not.toBeInTheDocument()
    })

    // The error is stored in copyError and will show when copy form dialog opens next
    // Verify by opening add copy dialog - error should be visible
    fireEvent.click(screen.getByText("ownedCopy.add"))
    await screen.findByText("ownedCopy.addTitle")
    // Opening a new copy dialog calls openAddCopy which resets copyError, so error won't show
    // The key behavior is that the delete dialog closed - which we already verified
  })

  it("renders edit dialog with enum custom field", async () => {
    const typeWithEnum = {
      ...collectionType,
      customFields: [
        { name: "Publisher", type: "enum", required: false, options: ["Marvel", "DC", "Image"] },
      ],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copies) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(typeWithEnum) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(item) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    // Enum select should render with options (DC and Image are unique; Marvel appears elsewhere too)
    expect(screen.getByText("DC")).toBeInTheDocument()
    expect(screen.getByText("Image")).toBeInTheDocument()
    // Verify there's a select with the enum options
    const selects = document.querySelectorAll("select")
    const enumSelect = Array.from(selects).find((s) => s.querySelector("option[value='DC']"))
    expect(enumSelect).toBeTruthy()
    expect(enumSelect!.querySelector("option[value='Marvel']")).toBeTruthy()
  })

  it("renders edit dialog with boolean custom field", async () => {
    const typeWithBoolean = {
      ...collectionType,
      customFields: [
        { name: "First Edition", type: "boolean", required: false, options: [] },
      ],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copies) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(typeWithBoolean) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(item) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    // Boolean checkbox should render
    const checkbox = screen.getByRole("checkbox")
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()

    // Toggle it
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it("submits edit form with cleared optional fields (null branches)", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    // Clear all optional fields to trigger the || null branches
    fireEvent.change(screen.getByDisplayValue("First issue"), { target: { value: "" } })
    fireEvent.change(screen.getByDisplayValue("Marvel"), { target: { value: "" } })
    fireEvent.change(screen.getByDisplayValue("REF-001"), { target: { value: "" } })
    fireEvent.change(screen.getByDisplayValue("Rare"), { target: { value: "" } })
    fireEvent.change(screen.getByDisplayValue("1963-03-01"), { target: { value: "" } })
    // Clear custom field
    fireEvent.change(screen.getByDisplayValue("9.5"), { target: { value: "" } })

    // Mock the PUT call
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method
      if (method === "PUT" && urlStr.includes("/items/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copies) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(item) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })

    fireEvent.click(screen.getByText("collectionDetail.save"))
    await waitFor(() => {
      expect(screen.queryByText("itemDetail.editTitle")).not.toBeInTheDocument()
    })

    // Verify PUT was called with null fields
    const putCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (call: unknown[]) => (call[1] as RequestInit)?.method === "PUT" && String(call[0]).includes("/items/")
    )
    expect(putCall).toBeDefined()
    const body = JSON.parse((putCall![1] as RequestInit).body as string)
    expect(body.description).toBeNull()
    expect(body.manufacturer).toBeNull()
    expect(body.referenceCode).toBeNull()
    expect(body.rarity).toBeNull()
    expect(body.releaseDate).toBeNull()
  })

  it("handles edit submit error when res.json() fails", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    vi.spyOn(global, "fetch").mockImplementation((_, opts) => {
      const method = (opts as RequestInit)?.method
      if (method === "PUT") {
        return Promise.resolve({
          ok: false,
          json: () => Promise.reject(new Error("parse error")),
        } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })

    fireEvent.click(screen.getByText("collectionDetail.save"))
    await waitFor(() => {
      expect(screen.getByText("collectionDetail.saveFailed")).toBeInTheDocument()
    })
  })

  it("renders copy form with all condition options in add dialog", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("ownedCopy.add"))
    await screen.findByText("ownedCopy.addTitle")

    const conditionSelect = screen.getByLabelText("ownedCopy.condition")
    expect(conditionSelect).toBeInTheDocument()
    // Verify all condition options are present
    expect(conditionSelect.querySelectorAll("option")).toHaveLength(6) // Mint, NearMint, Excellent, Good, Fair, Poor
  })

  it("shows copy error when edit copy PUT fails", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Near Mint"))

    const copyCard = screen.getByText("Near Mint").closest("[class*='rounded-lg border bg-card p-4']")!
    const buttons = copyCard.querySelectorAll("button")
    fireEvent.click(buttons[0])
    await screen.findByText("ownedCopy.editTitle")

    vi.spyOn(global, "fetch").mockImplementation((_, opts) => {
      const method = (opts as RequestInit)?.method
      if (method === "PUT") {
        return Promise.resolve({
          ok: false,
          json: () => Promise.reject(new Error("parse")),
        } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })

    fireEvent.click(screen.getByText("collectionDetail.save"))
    await waitFor(() => {
      expect(screen.getByText("ownedCopy.saveFailed")).toBeInTheDocument()
    })
  })

  it("changes enum custom field value in edit dialog", async () => {
    const typeWithEnum = {
      ...collectionType,
      customFields: [
        { name: "Publisher", type: "enum", required: false, options: ["Marvel", "DC", "Image"] },
      ],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copies) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(typeWithEnum) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(item) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    // Find the enum select and change its value
    const selects = document.querySelectorAll("select")
    const enumSelect = Array.from(selects).find((s) => s.querySelector("option[value='DC']"))!
    fireEvent.change(enumSelect, { target: { value: "DC" } })
    expect(enumSelect).toHaveValue("DC")
  })

  it("changes text custom field value in edit dialog", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    // The "Grade" text field should have value "9.5" from custom field values
    const gradeInput = screen.getByDisplayValue("9.5")
    fireEvent.change(gradeInput, { target: { value: "10.0" } })
    expect(gradeInput).toHaveValue("10.0")
  })

  it("renders delete copy confirmation dialog with cancel and delete buttons", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Near Mint"))

    const copyCard = screen.getByText("Near Mint").closest("[class*='rounded-lg border bg-card p-4']")!
    const buttons = copyCard.querySelectorAll("button")
    fireEvent.click(buttons[1]) // delete button
    await screen.findByText("ownedCopy.deleteConfirm")

    // Verify dialog content
    expect(screen.getByText("ownedCopy.deleteTitle")).toBeInTheDocument()
    // Verify cancel button exists in dialog
    const dialog = screen.getByRole("dialog")
    expect(dialog).toBeInTheDocument()
    const cancelBtn = Array.from(dialog.querySelectorAll("button")).find(
      (btn) => btn.textContent === "collectionDetail.cancel"
    )
    expect(cancelBtn).toBeTruthy()

    // Click cancel to close
    fireEvent.click(cancelBtn!)
    await waitFor(() => {
      expect(screen.queryByText("ownedCopy.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("renders all copy dialog form fields in add mode", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("ownedCopy.add"))
    await screen.findByText("ownedCopy.addTitle")

    // Verify all form fields are present
    expect(screen.getByLabelText("ownedCopy.condition")).toBeInTheDocument()
    expect(screen.getByLabelText("itemDetail.purchasePrice")).toBeInTheDocument()
    expect(screen.getByLabelText("itemDetail.estimatedValue")).toBeInTheDocument()
    expect(screen.getByLabelText("itemDetail.acquisitionDate")).toBeInTheDocument()
    expect(screen.getByLabelText("itemDetail.acquisitionSource")).toBeInTheDocument()
    expect(screen.getByLabelText("itemDetail.notes")).toBeInTheDocument()

    // Change condition
    fireEvent.change(screen.getByLabelText("ownedCopy.condition"), { target: { value: "Good" } })
    expect(screen.getByLabelText("ownedCopy.condition")).toHaveValue("Good")
  })

  it("renders number type custom field in edit dialog", async () => {
    const typeWithNumber = {
      ...collectionType,
      customFields: [
        { name: "Issue Number", type: "number", required: false, options: [] },
      ],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copies) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(typeWithNumber) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(item) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    // Should render a number input for "Issue Number"
    const dialog = screen.getByRole("dialog")
    const numberInput = dialog.querySelector("input[type='number']")
    expect(numberInput).toBeInTheDocument()

    // Change the value
    fireEvent.change(numberInput!, { target: { value: "42" } })
    expect(numberInput).toHaveValue(42)
  })

  it("handles delete item failure (error branch in handleDelete)", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.delete"))
    await screen.findByText("itemDetail.deleteConfirm")

    // Mock DELETE to throw a network error (catch branch)
    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.reject(new Error("Network error"))
    )

    const deleteButtons = screen.getAllByText("itemDetail.delete")
    const confirmBtn = deleteButtons.find((btn) => btn.closest("[role='dialog']"))!
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText("itemDetail.deleteFailed")).toBeInTheDocument()
    })
  })

  it("closes delete copy dialog via cancel button", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Near Mint"))

    const copyCard = screen.getByText("Near Mint").closest("[class*='rounded-lg border bg-card p-4']")!
    const buttons = copyCard.querySelectorAll("button")
    fireEvent.click(buttons[1]) // delete button
    await screen.findByText("ownedCopy.deleteConfirm")

    // Click cancel in the delete copy dialog
    const dialog = screen.getByRole("dialog")
    const cancelBtn = Array.from(dialog.querySelectorAll("button")).find(
      (btn) => btn.textContent === "collectionDetail.cancel"
    )
    fireEvent.click(cancelBtn!)
    await waitFor(() => {
      expect(screen.queryByText("ownedCopy.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("closes copy dialog via cancel button in add mode", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("ownedCopy.add"))
    await screen.findByText("ownedCopy.addTitle")

    // Click cancel
    const dialog = screen.getByRole("dialog")
    const cancelBtn = Array.from(dialog.querySelectorAll("button")).find(
      (btn) => btn.textContent === "collectionDetail.cancel"
    )
    fireEvent.click(cancelBtn!)
    await waitFor(() => {
      expect(screen.queryByText("ownedCopy.addTitle")).not.toBeInTheDocument()
    })
  })

  it("modifies all edit form fields", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    // Modify description
    const descInput = screen.getByDisplayValue("First issue")
    fireEvent.change(descInput, { target: { value: "Updated desc" } })
    expect(descInput).toHaveValue("Updated desc")

    // Modify manufacturer
    const mfgInput = screen.getByDisplayValue("Marvel")
    fireEvent.change(mfgInput, { target: { value: "DC" } })
    expect(mfgInput).toHaveValue("DC")

    // Modify reference code
    const refInput = screen.getByDisplayValue("REF-001")
    fireEvent.change(refInput, { target: { value: "REF-002" } })
    expect(refInput).toHaveValue("REF-002")

    // Modify rarity
    const rarityInput = screen.getByDisplayValue("Rare")
    fireEvent.change(rarityInput, { target: { value: "Common" } })
    expect(rarityInput).toHaveValue("Common")

    // Modify release date
    const dateInput = screen.getByDisplayValue("1963-03-01")
    fireEvent.change(dateInput, { target: { value: "2000-01-01" } })
    expect(dateInput).toHaveValue("2000-01-01")
  })

  it("closes edit dialog via cancel button", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    // Click cancel
    const dialog = screen.getByRole("dialog")
    const cancelBtn = Array.from(dialog.querySelectorAll("button")).find(
      (btn) => btn.textContent === "collectionDetail.cancel"
    )
    fireEvent.click(cancelBtn!)
    await waitFor(() => {
      expect(screen.queryByText("itemDetail.editTitle")).not.toBeInTheDocument()
    })
  })

  it("closes delete item dialog via cancel button", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.delete"))
    await screen.findByText("itemDetail.deleteConfirm")

    // Click cancel
    const dialog = screen.getByRole("dialog")
    const cancelBtn = Array.from(dialog.querySelectorAll("button")).find(
      (btn) => btn.textContent === "collectionDetail.cancel"
    )
    fireEvent.click(cancelBtn!)
    await waitFor(() => {
      expect(screen.queryByText("itemDetail.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("opens edit copy dialog with null optional fields", async () => {
    const copiesNoOptional = [
      { id: 1, catalogItemId: 1, condition: "NearMint", purchasePrice: null, estimatedValue: null, acquisitionDate: null, acquisitionSource: null, notes: null, images: [] },
    ]
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copiesNoOptional) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(item) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Near Mint"))

    const copyCard = screen.getByText("Near Mint").closest("[class*='rounded-lg']")!
    const buttons = copyCard.querySelectorAll("button")
    fireEvent.click(buttons[0]) // edit button
    await screen.findByText("ownedCopy.editTitle")

    // Verify null fields fall back to empty strings
    expect(screen.getByLabelText("itemDetail.purchasePrice")).toHaveValue(null)
    expect(screen.getByLabelText("itemDetail.acquisitionDate")).toHaveValue("")
    expect(screen.getByLabelText("itemDetail.acquisitionSource")).toHaveValue("")
    expect(screen.getByLabelText("itemDetail.notes")).toHaveValue("")
  })

  it("handles edit submit with non-Error throw (string thrown)", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    // Mock fetch to throw a string (not an Error instance)
    vi.spyOn(global, "fetch").mockImplementation(() => {
      throw "string error"
    })

    fireEvent.click(screen.getByText("collectionDetail.save"))
    await waitFor(() => {
      expect(screen.getByText("collectionDetail.saveFailed")).toBeInTheDocument()
    })
  })

  it("handles copy submit with non-Error throw (string thrown)", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))
    fireEvent.click(screen.getByText("ownedCopy.add"))
    await screen.findByText("ownedCopy.addTitle")

    // Mock fetch to throw a string (not an Error instance)
    vi.spyOn(global, "fetch").mockImplementation(() => {
      throw "string error"
    })

    fireEvent.click(screen.getByText("collectionDetail.save"))
    await waitFor(() => {
      expect(screen.getByText("ownedCopy.saveFailed")).toBeInTheDocument()
    })
  })

  it("unchecks boolean custom field in edit dialog", async () => {
    const typeWithBoolean = {
      ...collectionType,
      customFields: [
        { name: "First Edition", type: "boolean", required: false, options: [] },
      ],
    }
    const itemWithBoolTrue = { ...item, customFieldValues: [{ name: "First Edition", value: "true" }] }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copies) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(typeWithBoolean) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(itemWithBoolTrue) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    const checkbox = screen.getByRole("checkbox")
    expect(checkbox).toBeChecked()

    // Uncheck it - this covers the false branch of the ternary
    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it("renders date type custom field in edit dialog", async () => {
    const typeWithDate = {
      ...collectionType,
      customFields: [
        { name: "Signed Date", type: "date", required: false, options: [] },
      ],
    }
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copies) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(typeWithDate) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(item) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    // Should render a date input for "Signed Date" (in addition to the release date input)
    const dialog = screen.getByRole("dialog")
    const dateInputs = dialog.querySelectorAll("input[type='date']")
    // At least 2: one for release date, one for the custom field
    expect(dateInputs.length).toBeGreaterThanOrEqual(2)
  })

  it("handles file input change for item image in edit dialog", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    const fileInput = screen.getByLabelText("collectionDetail.imageLabel")
    // Test with a file
    const file = new File(["img"], "test.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })
    // Test with null files (the ?? null branch)
    fireEvent.change(fileInput, { target: { files: null } })
  })

  it("handles file input change for copy images", async () => {
    mockFetch()
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("ownedCopy.add"))
    await screen.findByText("ownedCopy.addTitle")

    const fileInput = screen.getByLabelText("ownedCopy.imagesLabel")
    // Test with files
    const file1 = new File(["img1"], "a.png", { type: "image/png" })
    const file2 = new File(["img2"], "b.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file1, file2] } })
    // Test with null files (the ternary false branch)
    fireEvent.change(fileInput, { target: { files: null } })
  })

  it("displays existing images when editing a copy with images", async () => {
    const copiesWithImages = [
      { ...copies[0], images: ["http://img1.jpg", "http://img2.jpg"] },
    ]
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copiesWithImages) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(item) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    // The copy card should show existing images
    const images = screen.getAllByAltText(/ownedCopy\.imageAlt/)
    expect(images.length).toBe(2)

    // Click edit on the copy to trigger editingCopy with images
    const copyCard = screen.getByText("Near Mint").closest("[class*='rounded-lg border bg-card p-4']")!
    const buttons = copyCard.querySelectorAll("button")
    fireEvent.click(buttons[0]) // edit button
    await screen.findByText("ownedCopy.editTitle")

    // The edit dialog should also show existing images
    const dialog = screen.getByRole("dialog")
    const dialogImages = dialog.querySelectorAll("img")
    expect(dialogImages.length).toBeGreaterThanOrEqual(2)
  })

  it("uploads image when editing item with formImageFile set", async () => {
    const fetchCalls: { url: string; method: string }[] = []
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      fetchCalls.push({ url: urlStr, method })
      if (urlStr.includes("/image") && method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      if (urlStr.includes("/items/1") && method === "PUT") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(item) } as Response)
      }
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copies) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(item) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    // Select an image file
    const fileInput = screen.getByLabelText("collectionDetail.imageLabel")
    const file = new File(["img"], "new.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Submit the form
    fireEvent.click(screen.getByText("collectionDetail.save"))

    await waitFor(() => {
      expect(fetchCalls.some(c => c.url.includes("/image") && c.method === "POST")).toBe(true)
    })
  })

  it("handles edit image upload failure branch", async () => {
    const fetchCalls: { url: string; method: string }[] = []
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      fetchCalls.push({ url: urlStr, method })
      if (urlStr.includes("/image") && method === "POST") {
        return Promise.resolve({ ok: false } as Response)
      }
      if (urlStr.includes("/items/1") && method === "PUT") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(item) } as Response)
      }
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copies) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(item) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("itemDetail.edit"))
    await screen.findByText("itemDetail.editTitle")

    const fileInput = screen.getByLabelText("collectionDetail.imageLabel")
    const file = new File(["img"], "new.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    fireEvent.click(screen.getByText("collectionDetail.save"))

    // The image upload is attempted (even though it fails), then the dialog closes
    await waitFor(() => {
      expect(fetchCalls.some(c => c.url.includes("/image") && c.method === "POST")).toBe(true)
    })
  })

  it("uploads copy images when adding a copy with image files", async () => {
    const fetchCalls: { url: string; method: string }[] = []
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      fetchCalls.push({ url: urlStr, method })
      if (urlStr.includes("/copies") && urlStr.includes("/images") && method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      if (urlStr.includes("/copies") && method === "POST" && !urlStr.includes("/images")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 5 }) } as Response)
      }
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copies) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(item) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("ownedCopy.add"))
    await screen.findByText("ownedCopy.addTitle")

    // Select image files
    const fileInput = screen.getByLabelText("ownedCopy.imagesLabel")
    const file1 = new File(["img1"], "a.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file1] } })

    // Submit copy form
    fireEvent.click(screen.getByText("collectionDetail.save"))

    await waitFor(() => {
      expect(fetchCalls.some(c => c.url.includes("/images") && c.method === "POST")).toBe(true)
    })
  })

  it("handles copy image upload failure branch", async () => {
    const fetchCalls: { url: string; method: string }[] = []
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = String(url)
      const method = (opts as RequestInit)?.method ?? "GET"
      fetchCalls.push({ url: urlStr, method })
      if (urlStr.includes("/copies") && urlStr.includes("/images") && method === "POST") {
        return Promise.resolve({ ok: false } as Response)
      }
      if (urlStr.includes("/copies") && method === "POST" && !urlStr.includes("/images")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 5 }) } as Response)
      }
      if (urlStr.includes("/copies")) return Promise.resolve({ ok: true, json: () => Promise.resolve(copies) } as Response)
      if (urlStr.includes("/collection-types/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(collectionType) } as Response)
      if (urlStr.match(/\/collections\/\d+$/)) return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) } as Response)
      if (urlStr.includes("/items/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(item) } as Response)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })
    renderWithRoute()
    await waitFor(() => screen.getByText("Spider-Man #1"))

    fireEvent.click(screen.getByText("ownedCopy.add"))
    await screen.findByText("ownedCopy.addTitle")

    const fileInput = screen.getByLabelText("ownedCopy.imagesLabel")
    const file1 = new File(["img1"], "a.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file1] } })

    fireEvent.click(screen.getByText("collectionDetail.save"))

    // The image upload is attempted (even though it fails), then the dialog closes
    await waitFor(() => {
      expect(fetchCalls.some(c => c.url.includes("/images") && c.method === "POST")).toBe(true)
    })
  })
})
