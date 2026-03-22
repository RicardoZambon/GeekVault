import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import CollectionTypes from "./collection-types-page"

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({ token: "tok", user: null, isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() }),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.name) return `${key}:${opts.name}`
      if (opts?.n) return `${key}:${opts.n}`
      if (opts?.count !== undefined) return `${key}:${opts.count}:${opts.max ?? ""}`
      return key
    },
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: (props: any) => {
      const { variants, initial, animate, exit, whileHover, whileTap, whileInView, ...rest } = props
      return <div {...rest} />
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock("@/components/ds", async () => {
  const actual = await vi.importActual("@/components/ds")
  return {
    ...actual,
    SortableList: ({ items, renderItem }: any) => (
      <div data-testid="sortable-list">
        {items.map((item: any, i: number) => (
          <div key={i}>{renderItem(item, { dragHandleProps: {}, isDragging: false })}</div>
        ))}
      </div>
    ),
    StaggerChildren: ({ children, ...props }: any) => {
      const { variants, initial, animate, exit, ...rest } = props
      return <div {...rest}>{children}</div>
    },
    staggerItemVariants: {},
    Select: ({ value, onValueChange, disabled, children }: any) => (
      <select
        value={value}
        onChange={(e: any) => onValueChange(e.target.value)}
        disabled={disabled}
        data-testid="ds-select"
      >
        {children}
      </select>
    ),
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
    Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs" data-default={defaultValue}>{children}</div>,
    TabsList: ({ children }: any) => <div role="tablist">{children}</div>,
    TabsTrigger: ({ children, value }: any) => <button role="tab" data-value={value}>{children}</button>,
    TabsContent: ({ children }: any) => <div>{children}</div>,
    DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
    DropdownMenuTrigger: ({ children, asChild }: any) => <>{children}</>,
    DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
    DropdownMenuItem: ({ children, onClick, ...props }: any) => (
      <button role="menuitem" onClick={onClick} {...props}>{children}</button>
    ),
    Tooltip: ({ children }: any) => <>{children}</>,
    TooltipTrigger: ({ children, asChild }: any) => <>{children}</>,
    TooltipContent: ({ children }: any) => <span>{children}</span>,
    TooltipProvider: ({ children }: any) => <>{children}</>,
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
  }
})

const types = [
  { id: 1, name: "Comics", description: "Comic books", icon: "BookOpen", customFieldSchema: [{ name: "Grade", type: "text", required: false, options: [] }] },
  { id: 2, name: "Cards", description: "", icon: "", customFieldSchema: [] },
]

const collections = [
  { id: 1, collectionTypeId: 1 },
  { id: 2, collectionTypeId: 1 },
  { id: 3, collectionTypeId: 2 },
]

// Helper to get toast mock from the mocked module
async function getToastMock() {
  const ds = await import("@/components/ds")
  return ds.toast
}

function mockFetchBoth(data = types, cols = collections) {
  vi.spyOn(global, "fetch").mockImplementation((url) => {
    const urlStr = typeof url === "string" ? url : url.toString()
    if (urlStr.includes("/api/collections")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(cols) } as Response)
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response)
  })
}

describe("CollectionTypes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows loading state with skeleton elements", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}))
    const { container } = render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    const pulseElements = container.querySelectorAll(".skeleton-pulse")
    expect(pulseElements.length).toBeGreaterThan(0)
  })

  it("renders types with card structure", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("Comics")).toBeInTheDocument()
      expect(screen.getByText("Cards")).toBeInTheDocument()
    })
    // Check type cards are rendered
    const cards = screen.getAllByTestId("type-card")
    expect(cards).toHaveLength(2)
  })

  it("shows empty state", async () => {
    mockFetchBoth([], [])
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("emptyStates.collectionTypes.title")).toBeInTheDocument()
    })
  })

  it("shows error on fetch failure via toast", async () => {
    const toastMock = await getToastMock()
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = typeof url === "string" ? url : url.toString()
      if (urlStr.includes("/api/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      return Promise.resolve({ ok: false } as Response)
    })
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("collectionTypes.fetchError")
    })
  })

  it("opens create dialog", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    expect(await screen.findByText("collectionTypes.createTitle")).toBeInTheDocument()
  })

  it("validates name required", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")
    fireEvent.click(screen.getAllByText("collectionTypes.create").pop()!)
    expect(await screen.findByText("collectionTypes.nameRequired")).toBeInTheDocument()
  })

  it("opens edit dialog via edit button", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Click the Edit button in the action row
    const editButtons = screen.getAllByText("collectionTypes.edit")
    fireEvent.click(editButtons[0])

    expect(await screen.findByText("collectionTypes.editTitle")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Comics")).toBeInTheDocument()
  })

  it("opens delete dialog via dropdown menu", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Click the more actions dropdown trigger
    const actionButtons = screen.getAllByLabelText("collectionTypes.moreActions")
    fireEvent.click(actionButtons[0])

    // Click the delete menu item
    const deleteItems = screen.getAllByText("collectionTypes.delete")
    fireEvent.click(deleteItems[0])

    expect(await screen.findByText("collectionTypes.deleteConfirmNamed:Comics")).toBeInTheDocument()
  })

  it("shows delete usage warning when type has collections", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Open delete for Comics (which has 2 collections)
    const actionButtons = screen.getAllByLabelText("collectionTypes.moreActions")
    fireEvent.click(actionButtons[0])
    const deleteItems = screen.getAllByText("collectionTypes.delete")
    fireEvent.click(deleteItems[0])

    await screen.findByText("collectionTypes.deleteConfirmNamed:Comics")
    expect(screen.getByTestId("delete-usage-warning")).toBeInTheDocument()
    expect(screen.getByText("collectionTypes.deleteWarning:2:")).toBeInTheDocument()
  })

  it("shows color-coded field type badges", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => {
      const badges = screen.getAllByTestId("field-badge")
      expect(badges.length).toBeGreaterThan(0)
      expect(badges[0]).toHaveTextContent("Grade")
      expect(badges[0]).toHaveAttribute("data-field-type", "text")
    })
  })

  it("shows metadata row with field count and collection count", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => {
      // Comics: 1 field, 2 collections — text is split across child nodes
      expect(screen.getByText((_, el) =>
        el?.tagName === "P" &&
        el?.textContent?.includes("collectionTypes.fieldCount:1:") &&
        el?.textContent?.includes("collectionTypes.collectionCount:2:")
        || false
      )).toBeInTheDocument()
    })
  })

  it("shows no custom fields badge when type has no fields", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("collectionTypes.noFieldsBadge")).toBeInTheDocument()
    })
  })

  it("shows icon picker grid when trigger is clicked", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.click(screen.getByTestId("icon-picker-trigger"))
    expect(screen.getByTestId("icon-picker-grid")).toBeInTheDocument()
  })

  it("selects icon from picker", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.click(screen.getByTestId("icon-picker-trigger"))
    // Click the "Library" icon button
    fireEvent.click(screen.getByLabelText("Library"))
    // Icon picker should close and show selected icon name
    expect(screen.getByText("Library")).toBeInTheDocument()
  })

  it("adds and removes custom fields", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    // No fields message visible
    expect(screen.getByText("collectionTypes.noFields")).toBeInTheDocument()

    // Add a field
    fireEvent.click(screen.getByText("collectionTypes.addField"))
    expect(screen.getByText("collectionTypes.fieldNumber:1")).toBeInTheDocument()

    // Remove the field via the trash icon button
    const removeButtons = document.querySelectorAll('[class*="h-7 w-7"]')
    fireEvent.click(removeButtons[0])
    expect(screen.getByText("collectionTypes.noFields")).toBeInTheDocument()
  })

  it("validates field name required", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    // Enter type name
    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel *"), { target: { value: "Test" } })

    // Add a field but don't name it
    fireEvent.click(screen.getByText("collectionTypes.addField"))
    fireEvent.click(screen.getAllByText("collectionTypes.create").pop()!)
    expect(await screen.findByText("collectionTypes.fieldNameRequired")).toBeInTheDocument()
  })

  it("validates enum options required", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel *"), { target: { value: "T" } })
    fireEvent.click(screen.getByText("collectionTypes.addField"))

    // Name the field
    const fieldNameInput = screen.getByPlaceholderText("collectionTypes.fieldNamePlaceholder")
    fireEvent.change(fieldNameInput, { target: { value: "Status" } })

    // Change type to enum via mocked native select
    const typeSelect = screen.getByTestId("ds-select")
    fireEvent.change(typeSelect, { target: { value: "enum" } })

    // Submit without options
    fireEvent.click(screen.getAllByText("collectionTypes.create").pop()!)
    expect(await screen.findByText("collectionTypes.enumOptionsRequired:Status")).toBeInTheDocument()
  })

  it("adds enum options via tag editor", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.click(screen.getByText("collectionTypes.addField"))

    // Change type to enum
    const typeSelect = screen.getByTestId("ds-select")
    fireEvent.change(typeSelect, { target: { value: "enum" } })

    // Add an option via the tag input + button
    const enumInput = screen.getByPlaceholderText("collectionTypes.enumTagPlaceholder")
    fireEvent.change(enumInput, { target: { value: "Option A" } })
    fireEvent.click(screen.getByText("collectionTypes.addOption"))

    // Option should appear as a badge/tag
    expect(screen.getByText("Option A")).toBeInTheDocument()
  })

  it("adds enum option via Enter key", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.click(screen.getByText("collectionTypes.addField"))

    const typeSelect = screen.getByTestId("ds-select")
    fireEvent.change(typeSelect, { target: { value: "enum" } })

    const enumInput = screen.getByPlaceholderText("collectionTypes.enumTagPlaceholder")
    fireEvent.change(enumInput, { target: { value: "TagA" } })
    fireEvent.keyDown(enumInput, { key: "Enter" })

    expect(screen.getByText("TagA")).toBeInTheDocument()
  })

  it("validates max fields", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel *"), { target: { value: "T" } })

    // Add 10 fields (max)
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByText("collectionTypes.addField"))
    }
    // The add button should now be disabled since we have 10 fields
    expect(screen.getByText("collectionTypes.addField")).toBeDisabled()
  })

  it("toggles field required checkbox", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.click(screen.getByText("collectionTypes.addField"))
    const checkbox = screen.getByRole("checkbox")
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it("creates collection type successfully", async () => {
    const toastMock = await getToastMock()
    let postCalled = false
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = typeof url === "string" ? url : url.toString()
      if (opts && (opts as RequestInit).method === "POST") {
        postCalled = true
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 3 }) } as Response)
      }
      if (urlStr.includes("/api/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(types) } as Response)
    })

    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel *"), { target: { value: "Figures" } })
    fireEvent.change(screen.getByLabelText("collectionTypes.descriptionLabel"), { target: { value: "Action figures" } })

    // Select an icon
    fireEvent.click(screen.getByTestId("icon-picker-trigger"))
    fireEvent.click(screen.getByLabelText("Trophy"))

    fireEvent.click(screen.getAllByText("collectionTypes.create").pop()!)
    await waitFor(() => {
      expect(postCalled).toBe(true)
      expect(toastMock.success).toHaveBeenCalledWith("collectionTypes.createSuccess")
    })
  })

  it("edits collection type successfully via PUT", async () => {
    const toastMock = await getToastMock()
    let putCalled = false
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = typeof url === "string" ? url : url.toString()
      if (opts && (opts as RequestInit).method === "PUT") {
        putCalled = true
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      if (urlStr.includes("/api/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(types) } as Response)
    })

    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Open edit via the Edit button
    const editButtons = screen.getAllByText("collectionTypes.edit")
    fireEvent.click(editButtons[0])
    await screen.findByText("collectionTypes.editTitle")

    fireEvent.change(screen.getByDisplayValue("Comics"), { target: { value: "Comics Updated" } })
    fireEvent.click(screen.getByText("collectionTypes.save"))

    await waitFor(() => {
      expect(putCalled).toBe(true)
      expect(toastMock.success).toHaveBeenCalledWith("collectionTypes.saveSuccess")
    })
  })

  it("shows error when create fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = typeof url === "string" ? url : url.toString()
      if (opts && (opts as RequestInit).method === "POST") {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: "Duplicate name" }) } as Response)
      }
      if (urlStr.includes("/api/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(types) } as Response)
    })

    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel *"), { target: { value: "Dup" } })
    fireEvent.click(screen.getAllByText("collectionTypes.create").pop()!)

    expect(await screen.findByText("Duplicate name")).toBeInTheDocument()
  })

  it("shows generic error when create fails and json parsing fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = typeof url === "string" ? url : url.toString()
      if (opts && (opts as RequestInit).method === "POST") {
        return Promise.resolve({ ok: false, json: () => Promise.reject(new Error("bad json")) } as Response)
      }
      if (urlStr.includes("/api/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(types) } as Response)
    })

    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel *"), { target: { value: "X" } })
    fireEvent.click(screen.getAllByText("collectionTypes.create").pop()!)

    expect(await screen.findByText("collectionTypes.saveFailed")).toBeInTheDocument()
  })

  it("deletes collection type successfully", async () => {
    const toastMock = await getToastMock()
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = typeof url === "string" ? url : url.toString()
      if (opts && (opts as RequestInit).method === "DELETE") {
        return Promise.resolve({ ok: true } as Response)
      }
      if (urlStr.includes("/api/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(types) } as Response)
    })

    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Open delete via dropdown
    const actionButtons = screen.getAllByLabelText("collectionTypes.moreActions")
    fireEvent.click(actionButtons[0])
    const deleteItems = screen.getAllByText("collectionTypes.delete")
    fireEvent.click(deleteItems[0])
    await screen.findByText("collectionTypes.deleteConfirmNamed:Comics")

    fireEvent.click(screen.getAllByText("collectionTypes.delete").pop()!)
    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith("collectionTypes.deleteSuccess")
    })
  })

  it("shows error when delete fails", async () => {
    const toastMock = await getToastMock()
    vi.spyOn(global, "fetch").mockImplementation((url, opts) => {
      const urlStr = typeof url === "string" ? url : url.toString()
      if (opts && (opts as RequestInit).method === "DELETE") {
        return Promise.resolve({ ok: false } as Response)
      }
      if (urlStr.includes("/api/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(types) } as Response)
    })

    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Open delete via dropdown
    const actionButtons = screen.getAllByLabelText("collectionTypes.moreActions")
    fireEvent.click(actionButtons[0])
    const deleteItems = screen.getAllByText("collectionTypes.delete")
    fireEvent.click(deleteItems[0])
    await screen.findByText("collectionTypes.deleteConfirmNamed:Comics")

    fireEvent.click(screen.getAllByText("collectionTypes.delete").pop()!)
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("collectionTypes.deleteFailed")
    })
  })

  it("changes field type and clears options when not enum", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.click(screen.getByText("collectionTypes.addField"))
    const typeSelect = screen.getByTestId("ds-select")

    // Change to enum
    fireEvent.change(typeSelect, { target: { value: "enum" } })
    expect(screen.getByText("collectionTypes.addOption")).toBeInTheDocument()

    // Add an option via tag editor
    const enumInput = screen.getByPlaceholderText("collectionTypes.enumTagPlaceholder")
    fireEvent.change(enumInput, { target: { value: "Opt1" } })
    fireEvent.click(screen.getByText("collectionTypes.addOption"))
    expect(screen.getByText("Opt1")).toBeInTheDocument()

    // Change to number - options should disappear
    const typeSelect2 = screen.getByTestId("ds-select")
    fireEvent.change(typeSelect2, { target: { value: "number" } })
    expect(screen.queryByText("collectionTypes.addOption")).not.toBeInTheDocument()
  })

  it("removes enum option tag", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.click(screen.getByText("collectionTypes.addField"))
    const typeSelect = screen.getByTestId("ds-select")
    fireEvent.change(typeSelect, { target: { value: "enum" } })

    // Add two options
    const enumInput = screen.getByPlaceholderText("collectionTypes.enumTagPlaceholder")
    fireEvent.change(enumInput, { target: { value: "A" } })
    fireEvent.click(screen.getByText("collectionTypes.addOption"))
    fireEvent.change(enumInput, { target: { value: "B" } })
    fireEvent.click(screen.getByText("collectionTypes.addOption"))

    expect(screen.getByText("A")).toBeInTheDocument()
    expect(screen.getByText("B")).toBeInTheDocument()

    // Remove first option - click the X button in the badge
    const badgeRemoveButtons = document.querySelectorAll(".pl-6 button.rounded-full")
    fireEvent.click(badgeRemoveButtons[0])

    expect(screen.queryByText("A")).not.toBeInTheDocument()
    expect(screen.getByText("B")).toBeInTheDocument()
  })

  it("closes create dialog via cancel button", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.click(screen.getByText("collectionTypes.cancel"))
    await waitFor(() => {
      expect(screen.queryByText("collectionTypes.createTitle")).not.toBeInTheDocument()
    })
  })

  it("closes delete dialog via Escape key (triggers onOpenChange)", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const actionButtons = screen.getAllByLabelText("collectionTypes.moreActions")
    fireEvent.click(actionButtons[0])
    const deleteItems = screen.getAllByText("collectionTypes.delete")
    fireEvent.click(deleteItems[0])
    await screen.findByText("collectionTypes.deleteConfirmNamed:Comics")

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    await waitFor(() => {
      expect(screen.queryByText("collectionTypes.deleteConfirmNamed:Comics")).not.toBeInTheDocument()
    })
  })

  it("closes delete dialog via cancel button", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const actionButtons = screen.getAllByLabelText("collectionTypes.moreActions")
    fireEvent.click(actionButtons[0])
    const deleteItems = screen.getAllByText("collectionTypes.delete")
    fireEvent.click(deleteItems[0])
    await screen.findByText("collectionTypes.deleteConfirmNamed:Comics")

    fireEvent.click(screen.getByText("collectionTypes.cancel"))
    await waitFor(() => {
      expect(screen.queryByText("collectionTypes.deleteConfirmNamed:Comics")).not.toBeInTheDocument()
    })
  })

  it("shows fields count display", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel *"), { target: { value: "Test" } })

    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByText("collectionTypes.addField"))
    }
    expect(screen.getByText("collectionTypes.fieldsCount:10:10")).toBeInTheDocument()
  })

  it("shows max fields error when editing type with more than 10 fields", async () => {
    const fields = Array.from({ length: 11 }, (_, i) => ({
      name: `Field${i}`, type: "text", required: false, options: [],
    }))
    const typeWith11Fields = [
      { id: 1, name: "Overloaded", description: "", icon: "", customFieldSchema: fields },
    ]
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = typeof url === "string" ? url : url.toString()
      if (urlStr.includes("/api/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(typeWith11Fields) } as Response)
    })
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Overloaded"))

    // Open edit dialog via Edit button
    const editButtons = screen.getAllByText("collectionTypes.edit")
    fireEvent.click(editButtons[0])
    await screen.findByText("collectionTypes.editTitle")

    // Submit - should trigger maxFields validation
    fireEvent.click(screen.getAllByText("collectionTypes.save").pop()!)
    await waitFor(() => {
      expect(screen.getByText("collectionTypes.maxFields")).toBeInTheDocument()
    })
  })

  it("does not add duplicate enum options", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.click(screen.getByText("collectionTypes.addField"))
    const typeSelect = screen.getByTestId("ds-select")
    fireEvent.change(typeSelect, { target: { value: "enum" } })

    const enumInput = screen.getByPlaceholderText("collectionTypes.enumTagPlaceholder")

    // Add option "A"
    fireEvent.change(enumInput, { target: { value: "A" } })
    fireEvent.click(screen.getByText("collectionTypes.addOption"))
    expect(screen.getByText("A")).toBeInTheDocument()

    // Try adding "A" again - should not duplicate
    fireEvent.change(enumInput, { target: { value: "A" } })
    fireEvent.click(screen.getByText("collectionTypes.addOption"))
    const allAs = screen.getAllByText("A")
    expect(allAs.length).toBe(1)
  })

  it("does not add empty enum options", async () => {
    mockFetchBoth()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.click(screen.getByText("collectionTypes.addField"))
    const typeSelect = screen.getByTestId("ds-select")
    fireEvent.change(typeSelect, { target: { value: "enum" } })

    // Try adding empty option
    fireEvent.click(screen.getByText("collectionTypes.addOption"))

    // No badge tags should appear
    const badges = document.querySelectorAll(".pl-6 .gap-1")
    expect(badges.length).toBe(0)
  })

  it("shows overflow badge when type has more than 5 fields", async () => {
    const manyFields = Array.from({ length: 7 }, (_, i) => ({
      name: `Field${i}`, type: "text", required: false, options: [],
    }))
    const typeWithManyFields = [
      { id: 1, name: "ManyFields", description: "", icon: "Library", customFieldSchema: manyFields },
    ]
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const urlStr = typeof url === "string" ? url : url.toString()
      if (urlStr.includes("/api/collections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(typeWithManyFields) } as Response)
    })
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("ManyFields")).toBeInTheDocument()
      // 5 visible badges + 1 overflow
      const badges = screen.getAllByTestId("field-badge")
      expect(badges).toHaveLength(5)
      expect(screen.getByText("+2 collectionTypes.moreFields")).toBeInTheDocument()
    })
  })
})
