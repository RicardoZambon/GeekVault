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
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
  }
})

const types = [
  { id: 1, name: "Comics", description: "Comic books", icon: "\u{1F4DA}", customFieldSchema: [{ name: "Grade", type: "text", required: false, options: [] }] },
  { id: 2, name: "Cards", description: "", icon: "", customFieldSchema: [] },
]

// Helper to get toast mock from the mocked module
async function getToastMock() {
  const ds = await import("@/components/ds")
  return ds.toast
}

describe("CollectionTypes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockFetch(data = types) {
    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response)
    )
  }

  it("shows loading state with skeleton elements", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}))
    const { container } = render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    const pulseElements = container.querySelectorAll(".animate-pulse")
    expect(pulseElements.length).toBeGreaterThan(0)
  })

  it("renders types", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("Comics")).toBeInTheDocument()
      expect(screen.getByText("Cards")).toBeInTheDocument()
    })
  })

  it("shows empty state", async () => {
    mockFetch([])
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("emptyStates.collectionTypes.title")).toBeInTheDocument()
    })
  })

  it("shows error on fetch failure via toast", async () => {
    const toastMock = await getToastMock()
    vi.spyOn(global, "fetch").mockResolvedValueOnce({ ok: false } as Response)
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("collectionTypes.fetchError")
    })
  })

  it("opens create dialog", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    expect(await screen.findByText("collectionTypes.createTitle")).toBeInTheDocument()
  })

  it("validates name required", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")
    fireEvent.click(screen.getAllByText("collectionTypes.create").pop()!)
    expect(await screen.findByText("collectionTypes.nameRequired")).toBeInTheDocument()
  })

  it("opens edit dialog via dropdown menu", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Click the three-dot dropdown trigger
    const actionButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(actionButtons[0])

    // Click the edit menu item
    const editItems = screen.getAllByText("collectionTypes.edit")
    fireEvent.click(editItems[0])

    expect(await screen.findByText("collectionTypes.editTitle")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Comics")).toBeInTheDocument()
  })

  it("opens delete dialog via dropdown menu", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Click the three-dot dropdown trigger
    const actionButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(actionButtons[0])

    // Click the delete menu item
    const deleteItems = screen.getAllByText("collectionTypes.delete")
    fireEvent.click(deleteItems[0])

    expect(await screen.findByText("collectionTypes.deleteConfirm")).toBeInTheDocument()
  })

  it("adds and removes custom fields", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    // No fields message visible (tabs mock renders all content)
    expect(screen.getByText("collectionTypes.noFields")).toBeInTheDocument()

    // Add a field
    fireEvent.click(screen.getByText("collectionTypes.addField"))
    expect(screen.getByText("collectionTypes.fieldNumber:1")).toBeInTheDocument()

    // Remove the field via the small icon button (h-7 w-7)
    const removeButtons = document.querySelectorAll('[class*="h-7 w-7"]')
    fireEvent.click(removeButtons[0])
    expect(screen.getByText("collectionTypes.noFields")).toBeInTheDocument()
  })

  it("validates field name required", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    // Enter type name
    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel"), { target: { value: "Test" } })

    // Add a field but don't name it
    fireEvent.click(screen.getByText("collectionTypes.addField"))
    fireEvent.click(screen.getAllByText("collectionTypes.create").pop()!)
    expect(await screen.findByText("collectionTypes.fieldNameRequired")).toBeInTheDocument()
  })

  it("validates enum options required", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel"), { target: { value: "T" } })
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
    mockFetch()
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
    mockFetch()
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
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel"), { target: { value: "T" } })

    // Add 10 fields (max)
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByText("collectionTypes.addField"))
    }
    // The add button should now be disabled since we have 10 fields
    expect(screen.getByText("collectionTypes.addField")).toBeDisabled()
  })

  it("shows custom field badges", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("Grade")).toBeInTheDocument()
    })
  })

  it("toggles field required checkbox", async () => {
    mockFetch()
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
    vi.spyOn(global, "fetch").mockImplementation((_url, opts) => {
      if (opts && (opts as RequestInit).method === "POST") {
        postCalled = true
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 3 }) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(types) } as Response)
    })

    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel"), { target: { value: "Figures" } })
    fireEvent.change(screen.getByLabelText("collectionTypes.descriptionLabel"), { target: { value: "Action figures" } })
    fireEvent.change(screen.getByLabelText("collectionTypes.iconLabel"), { target: { value: "\u{1F9F8}" } })

    fireEvent.click(screen.getAllByText("collectionTypes.create").pop()!)
    await waitFor(() => {
      expect(postCalled).toBe(true)
      expect(toastMock.success).toHaveBeenCalledWith("collectionTypes.createSuccess")
    })
  })

  it("edits collection type successfully via PUT", async () => {
    const toastMock = await getToastMock()
    let putCalled = false
    vi.spyOn(global, "fetch").mockImplementation((_url, opts) => {
      if (opts && (opts as RequestInit).method === "PUT") {
        putCalled = true
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(types) } as Response)
    })

    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Open edit via dropdown
    const actionButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(actionButtons[0])
    const editItems = screen.getAllByText("collectionTypes.edit")
    fireEvent.click(editItems[0])
    await screen.findByText("collectionTypes.editTitle")

    fireEvent.change(screen.getByDisplayValue("Comics"), { target: { value: "Comics Updated" } })
    fireEvent.click(screen.getByText("collectionTypes.save"))

    await waitFor(() => {
      expect(putCalled).toBe(true)
      expect(toastMock.success).toHaveBeenCalledWith("collectionTypes.saveSuccess")
    })
  })

  it("shows error when create fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation((_url, opts) => {
      if (opts && (opts as RequestInit).method === "POST") {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: "Duplicate name" }) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(types) } as Response)
    })

    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel"), { target: { value: "Dup" } })
    fireEvent.click(screen.getAllByText("collectionTypes.create").pop()!)

    expect(await screen.findByText("Duplicate name")).toBeInTheDocument()
  })

  it("shows generic error when create fails and json parsing fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation((_url, opts) => {
      if (opts && (opts as RequestInit).method === "POST") {
        return Promise.resolve({ ok: false, json: () => Promise.reject(new Error("bad json")) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(types) } as Response)
    })

    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel"), { target: { value: "X" } })
    fireEvent.click(screen.getAllByText("collectionTypes.create").pop()!)

    expect(await screen.findByText("collectionTypes.saveFailed")).toBeInTheDocument()
  })

  it("deletes collection type successfully", async () => {
    const toastMock = await getToastMock()
    vi.spyOn(global, "fetch").mockImplementation((_url, opts) => {
      if (opts && (opts as RequestInit).method === "DELETE") {
        return Promise.resolve({ ok: true } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(types) } as Response)
    })

    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Open delete via dropdown
    const actionButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(actionButtons[0])
    const deleteItems = screen.getAllByText("collectionTypes.delete")
    fireEvent.click(deleteItems[0])
    await screen.findByText("collectionTypes.deleteConfirm")

    fireEvent.click(screen.getAllByText("collectionTypes.delete").pop()!)
    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith("collectionTypes.deleteSuccess")
    })
  })

  it("shows error when delete fails", async () => {
    const toastMock = await getToastMock()
    vi.spyOn(global, "fetch").mockImplementation((_url, opts) => {
      if (opts && (opts as RequestInit).method === "DELETE") {
        return Promise.resolve({ ok: false } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(types) } as Response)
    })

    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    // Open delete via dropdown
    const actionButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(actionButtons[0])
    const deleteItems = screen.getAllByText("collectionTypes.delete")
    fireEvent.click(deleteItems[0])
    await screen.findByText("collectionTypes.deleteConfirm")

    fireEvent.click(screen.getAllByText("collectionTypes.delete").pop()!)
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("collectionTypes.deleteFailed")
    })
  })

  it("changes field type and clears options when not enum", async () => {
    mockFetch()
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
    mockFetch()
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
    mockFetch()
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
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const actionButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(actionButtons[0])
    const deleteItems = screen.getAllByText("collectionTypes.delete")
    fireEvent.click(deleteItems[0])
    await screen.findByText("collectionTypes.deleteConfirm")

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    await waitFor(() => {
      expect(screen.queryByText("collectionTypes.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("closes delete dialog via cancel button", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const actionButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(actionButtons[0])
    const deleteItems = screen.getAllByText("collectionTypes.delete")
    fireEvent.click(deleteItems[0])
    await screen.findByText("collectionTypes.deleteConfirm")

    fireEvent.click(screen.getByText("collectionTypes.cancel"))
    await waitFor(() => {
      expect(screen.queryByText("collectionTypes.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("shows fields count display", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel"), { target: { value: "Test" } })

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
    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(typeWith11Fields) } as Response)
    )
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Overloaded"))

    // Open edit dialog via dropdown (which loads 11 fields from API)
    const actionButtons = screen.getAllByLabelText("collections.actions")
    fireEvent.click(actionButtons[0])
    const editItems = screen.getAllByText("collectionTypes.edit")
    fireEvent.click(editItems[0])
    await screen.findByText("collectionTypes.editTitle")

    // Submit - should trigger maxFields validation
    fireEvent.click(screen.getAllByText("collectionTypes.save").pop()!)
    await waitFor(() => {
      expect(screen.getByText("collectionTypes.maxFields")).toBeInTheDocument()
    })
  })

  it("does not add duplicate enum options", async () => {
    mockFetch()
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
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.click(screen.getByText("collectionTypes.addField"))
    const typeSelect = screen.getByTestId("ds-select")
    fireEvent.change(typeSelect, { target: { value: "enum" } })

    // Try adding empty option
    fireEvent.click(screen.getByText("collectionTypes.addOption"))

    // No badge tags should appear (only the existing UI text)
    const badges = document.querySelectorAll(".pl-6 .gap-1")
    expect(badges.length).toBe(0)
  })
})
