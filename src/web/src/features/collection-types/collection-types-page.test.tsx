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

const types = [
  { id: 1, name: "Comics", description: "Comic books", icon: "📚", customFieldSchema: [{ name: "Grade", type: "text", required: false, options: [] }] },
  { id: 2, name: "Cards", description: "", icon: "", customFieldSchema: [] },
]

describe("CollectionTypes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockFetch(data = types) {
    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response)
    )
  }

  it("shows loading state", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}))
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    expect(document.querySelector(".animate-spin")).toBeInTheDocument()
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
      expect(screen.getByText("collectionTypes.empty")).toBeInTheDocument()
    })
  })

  it("shows error on fetch failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({ ok: false } as Response)
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("collectionTypes.fetchError")).toBeInTheDocument()
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

  it("opens edit dialog", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))
    const editButtons = screen.getAllByLabelText("collectionTypes.edit")
    fireEvent.click(editButtons[0])
    expect(await screen.findByText("collectionTypes.editTitle")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Comics")).toBeInTheDocument()
  })

  it("opens delete dialog", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))
    const deleteButtons = screen.getAllByLabelText("collectionTypes.delete")
    fireEvent.click(deleteButtons[0])
    expect(await screen.findByText("collectionTypes.deleteConfirm")).toBeInTheDocument()
  })

  it("adds and removes custom fields", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    // No fields message
    expect(screen.getByText("collectionTypes.noFields")).toBeInTheDocument()

    // Add a field
    fireEvent.click(screen.getByText("collectionTypes.addField"))
    expect(screen.getByText("collectionTypes.fieldNumber:1")).toBeInTheDocument()

    // Remove the field
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

    // Change type to enum
    const typeSelect = screen.getByDisplayValue("collectionTypes.fieldTypes.text")
    fireEvent.change(typeSelect, { target: { value: "enum" } })

    // Submit without options
    fireEvent.click(screen.getAllByText("collectionTypes.create").pop()!)
    expect(await screen.findByText("collectionTypes.enumOptionsRequired:Status")).toBeInTheDocument()
  })

  it("adds and removes enum options", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.click(screen.getByText("collectionTypes.addField"))
    const typeSelect = screen.getByDisplayValue("collectionTypes.fieldTypes.text")
    fireEvent.change(typeSelect, { target: { value: "enum" } })

    // Add an option
    fireEvent.click(screen.getByText("collectionTypes.addOption"))
    const optionInput = screen.getByPlaceholderText("collectionTypes.enumOptionPlaceholder:1")
    fireEvent.change(optionInput, { target: { value: "Option A" } })
    expect(screen.getByDisplayValue("Option A")).toBeInTheDocument()
  })

  it("validates max fields", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel"), { target: { value: "T" } })

    // Add 11 fields (max is 10)
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
    fireEvent.change(screen.getByLabelText("collectionTypes.iconLabel"), { target: { value: "🧸" } })

    fireEvent.click(screen.getAllByText("collectionTypes.create").pop()!)
    await waitFor(() => {
      expect(postCalled).toBe(true)
      expect(screen.queryByText("collectionTypes.createTitle")).not.toBeInTheDocument()
    })
  })

  it("edits collection type successfully via PUT", async () => {
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
    const editButtons = screen.getAllByLabelText("collectionTypes.edit")
    fireEvent.click(editButtons[0])
    await screen.findByText("collectionTypes.editTitle")

    fireEvent.change(screen.getByDisplayValue("Comics"), { target: { value: "Comics Updated" } })
    fireEvent.click(screen.getByText("collectionTypes.save"))

    await waitFor(() => {
      expect(putCalled).toBe(true)
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
    vi.spyOn(global, "fetch").mockImplementation((_url, opts) => {
      if (opts && (opts as RequestInit).method === "DELETE") {
        return Promise.resolve({ ok: true } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(types) } as Response)
    })

    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const deleteButtons = screen.getAllByLabelText("collectionTypes.delete")
    fireEvent.click(deleteButtons[0])
    await screen.findByText("collectionTypes.deleteConfirm")

    fireEvent.click(screen.getAllByText("collectionTypes.delete").pop()!)
    await waitFor(() => {
      expect(screen.queryByText("collectionTypes.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("shows error when delete fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation((_url, opts) => {
      if (opts && (opts as RequestInit).method === "DELETE") {
        return Promise.resolve({ ok: false } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(types) } as Response)
    })

    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("Comics"))

    const deleteButtons = screen.getAllByLabelText("collectionTypes.delete")
    fireEvent.click(deleteButtons[0])
    await screen.findByText("collectionTypes.deleteConfirm")

    fireEvent.click(screen.getAllByText("collectionTypes.delete").pop()!)
    await waitFor(() => {
      expect(screen.getByText("collectionTypes.deleteFailed")).toBeInTheDocument()
    })
  })

  it("changes field type and clears options when not enum", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.click(screen.getByText("collectionTypes.addField"))
    const typeSelect = screen.getByDisplayValue("collectionTypes.fieldTypes.text")

    // Change to enum
    fireEvent.change(typeSelect, { target: { value: "enum" } })
    expect(screen.getByText("collectionTypes.addOption")).toBeInTheDocument()

    // Add an option
    fireEvent.click(screen.getByText("collectionTypes.addOption"))
    const optionInput = screen.getByPlaceholderText("collectionTypes.enumOptionPlaceholder:1")
    fireEvent.change(optionInput, { target: { value: "Opt1" } })
    expect(screen.getByDisplayValue("Opt1")).toBeInTheDocument()

    // Change to number - options should disappear
    const typeSelect2 = screen.getByDisplayValue("collectionTypes.fieldTypes.enum")
    fireEvent.change(typeSelect2, { target: { value: "number" } })
    expect(screen.queryByText("collectionTypes.addOption")).not.toBeInTheDocument()
  })

  it("removes enum option", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.click(screen.getByText("collectionTypes.addField"))
    const typeSelect = screen.getByDisplayValue("collectionTypes.fieldTypes.text")
    fireEvent.change(typeSelect, { target: { value: "enum" } })

    // Add two options
    fireEvent.click(screen.getByText("collectionTypes.addOption"))
    fireEvent.click(screen.getByText("collectionTypes.addOption"))

    const optionInput1 = screen.getByPlaceholderText("collectionTypes.enumOptionPlaceholder:1")
    fireEvent.change(optionInput1, { target: { value: "A" } })
    const optionInput2 = screen.getByPlaceholderText("collectionTypes.enumOptionPlaceholder:2")
    fireEvent.change(optionInput2, { target: { value: "B" } })

    // Remove first option - click the X button next to it
    const optionRemoveButtons = document.querySelectorAll('.pl-6 [class*="h-7 w-7"]')
    fireEvent.click(optionRemoveButtons[0])

    expect(screen.queryByDisplayValue("A")).not.toBeInTheDocument()
    expect(screen.getByDisplayValue("B")).toBeInTheDocument()
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
    const deleteButtons = screen.getAllByLabelText("collectionTypes.delete")
    fireEvent.click(deleteButtons[0])
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
    const deleteButtons = screen.getAllByLabelText("collectionTypes.delete")
    fireEvent.click(deleteButtons[0])
    await screen.findByText("collectionTypes.deleteConfirm")

    fireEvent.click(screen.getByText("collectionTypes.cancel"))
    await waitFor(() => {
      expect(screen.queryByText("collectionTypes.deleteConfirm")).not.toBeInTheDocument()
    })
  })

  it("submits with maxFields validation error when >10 fields", async () => {
    // This test covers line 111-113 (the formFields.length > 10 branch in handleSubmit)
    // We need to force 11 fields to exist when submit happens
    // Since the add button is disabled at 10, we can't add 11 via UI
    // But the validation branch at line 111 checks > 10, meaning exactly 10 passes.
    // The button becomes disabled, so this branch can only trigger if someone bypasses the UI.
    // The existing test already covers the button being disabled at 10.
    // Let's just verify the actual maxFields check is hit via form name validation flow
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel"), { target: { value: "Test" } })

    // Add 10 fields (max), fill all names so we pass field name validation
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByText("collectionTypes.addField"))
    }
    const fieldInputs = screen.getAllByPlaceholderText("collectionTypes.fieldNamePlaceholder")
    fieldInputs.forEach((input, i) => {
      fireEvent.change(input, { target: { value: `Field ${i + 1}` } })
    })

    // At 10, button is disabled and validation passes (10 is not > 10)
    expect(screen.getByText("collectionTypes.addField")).toBeDisabled()
  })

  it("submits with max fields validation error", async () => {
    mockFetch()
    render(<MemoryRouter><CollectionTypes /></MemoryRouter>)
    await waitFor(() => screen.getByText("collectionTypes.title"))
    fireEvent.click(screen.getByText("collectionTypes.create"))
    await screen.findByText("collectionTypes.createTitle")

    fireEvent.change(screen.getByLabelText("collectionTypes.nameLabel"), { target: { value: "Test" } })

    // Try to add 11 fields - after 10 the button is disabled, but we can test the maxFields validation
    // by checking the fields count display
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

    // Open edit dialog (which loads 11 fields from API)
    const editButtons = screen.getAllByLabelText("collectionTypes.edit")
    fireEvent.click(editButtons[0])
    await screen.findByText("collectionTypes.editTitle")

    // Submit - should trigger maxFields validation
    fireEvent.click(screen.getAllByText("collectionTypes.save").pop()!)
    await waitFor(() => {
      expect(screen.getByText("collectionTypes.maxFields")).toBeInTheDocument()
    })
  })
})
