import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ImportWizard } from "./import-wizard"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.count !== undefined) return `${key}:${opts.count}`
      return key
    },
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}))

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

vi.mock("@/components/ds", async () => {
  const actual = await vi.importActual("@/components/ds")
  return { ...actual, toast: mockToast }
})

describe("ImportWizard", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    collectionId: "1",
    token: "test-token",
    onImportComplete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders step 1 upload UI when open", () => {
    render(<ImportWizard {...defaultProps} />)
    expect(screen.getByText("collectionDetail.importTitle")).toBeInTheDocument()
    expect(screen.getByText("collectionDetail.importDropHere")).toBeInTheDocument()
  })

  it("shows step indicators", () => {
    render(<ImportWizard {...defaultProps} />)
    expect(screen.getByText("collectionDetail.importStepUpload")).toBeInTheDocument()
    expect(screen.getByText("collectionDetail.importStepPreview")).toBeInTheDocument()
    expect(screen.getByText("collectionDetail.importStepConfirm")).toBeInTheDocument()
  })

  it("shows file info after file selection", () => {
    render(<ImportWizard {...defaultProps} />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["name,value\nTest,1"], "items.csv", { type: "text/csv" })
    Object.defineProperty(fileInput, "files", { value: [file] })
    fireEvent.change(fileInput)
    expect(screen.getByText("items.csv")).toBeInTheDocument()
  })

  it("handles drag over event", () => {
    render(<ImportWizard {...defaultProps} />)
    const dropZone = screen.getByText("collectionDetail.importDropHere").closest("div")!
    fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } })
    // Should add drag styling - no crash
  })

  it("handles drag leave event", () => {
    render(<ImportWizard {...defaultProps} />)
    const dropZone = screen.getByText("collectionDetail.importDropHere").closest("div")!
    fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } })
    fireEvent.dragLeave(dropZone, { dataTransfer: { files: [] } })
    // Should remove drag styling - no crash
  })

  it("handles file drop with CSV file", () => {
    render(<ImportWizard {...defaultProps} />)
    const dropZone = screen.getByText("collectionDetail.importDropHere").closest("div")!
    const file = new File(["data"], "test.csv", { type: "text/csv" })
    Object.defineProperty(file, "name", { value: "test.csv" })
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })
    expect(screen.getByText("test.csv")).toBeInTheDocument()
  })

  it("shows error toast when non-CSV file dropped", () => {
    render(<ImportWizard {...defaultProps} />)
    const dropZone = screen.getByText("collectionDetail.importDropHere").closest("div")!
    const file = new File(["data"], "test.txt", { type: "text/plain" })
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })
    expect(mockToast.error).toHaveBeenCalledWith("collectionDetail.importNoFile")
  })

  it("disables Next button when no file selected", () => {
    render(<ImportWizard {...defaultProps} />)
    const nextBtn = screen.getByText("collectionDetail.importNext")
    expect(nextBtn.closest("button")).toBeDisabled()
  })

  it("calls onOpenChange when cancel clicked", () => {
    render(<ImportWizard {...defaultProps} />)
    fireEvent.click(screen.getByText("collectionDetail.importCancel"))
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("shows preview step after successful preview API call", async () => {
    const previewData = {
      rows: [
        { rowNumber: 1, data: { name: "Item 1", value: "100" }, errors: [] },
        { rowNumber: 2, data: { name: "Item 2", value: "" }, errors: ["Value required"] },
      ],
      validCount: 1,
      errorCount: 1,
    }

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(previewData),
    } as Response)

    render(<ImportWizard {...defaultProps} />)

    // Select a file first
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["name,value\nItem 1,100"], "items.csv", { type: "text/csv" })
    Object.defineProperty(fileInput, "files", { value: [file] })
    fireEvent.change(fileInput)

    // Click next
    fireEvent.click(screen.getByText("collectionDetail.importNext"))

    await waitFor(() => {
      expect(screen.getByText("collectionDetail.importValidRows:1")).toBeInTheDocument()
    })
    expect(screen.getByText("collectionDetail.importErrorRows:1")).toBeInTheDocument()
  })

  it("shows error toast on preview API failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "bad file" }),
    } as Response)

    render(<ImportWizard {...defaultProps} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["bad"], "items.csv", { type: "text/csv" })
    Object.defineProperty(fileInput, "files", { value: [file] })
    fireEvent.change(fileInput)

    fireEvent.click(screen.getByText("collectionDetail.importNext"))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("bad file")
    })
  })

  it("shows step 3 done state after confirm", async () => {
    const previewData = {
      rows: [{ rowNumber: 1, data: { name: "Item" }, errors: [] }],
      validCount: 1,
      errorCount: 0,
    }

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(previewData),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ importedCount: 1 }),
      } as Response)

    render(<ImportWizard {...defaultProps} />)

    // Select file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["name\nItem"], "items.csv", { type: "text/csv" })
    Object.defineProperty(fileInput, "files", { value: [file] })
    fireEvent.change(fileInput)

    // Preview
    fireEvent.click(screen.getByText("collectionDetail.importNext"))
    await waitFor(() => screen.getByText("collectionDetail.importConfirmCount:1"))

    // Confirm
    fireEvent.click(screen.getByText("collectionDetail.importConfirmCount:1"))
    await waitFor(() => {
      expect(screen.getByText("collectionDetail.importSuccess:1")).toBeInTheDocument()
    })
    expect(defaultProps.onImportComplete).toHaveBeenCalled()
  })

  it("goes back from step 2 to step 1", async () => {
    const previewData = {
      rows: [{ rowNumber: 1, data: { name: "Item" }, errors: [] }],
      validCount: 1,
      errorCount: 0,
    }

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(previewData),
    } as Response)

    render(<ImportWizard {...defaultProps} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["name\nItem"], "items.csv", { type: "text/csv" })
    Object.defineProperty(fileInput, "files", { value: [file] })
    fireEvent.change(fileInput)

    fireEvent.click(screen.getByText("collectionDetail.importNext"))
    await waitFor(() => screen.getByText("collectionDetail.importBack"))

    fireEvent.click(screen.getByText("collectionDetail.importBack"))
    expect(screen.getByText("items.csv")).toBeInTheDocument()
  })

  it("closes on done button in step 3", async () => {
    const previewData = {
      rows: [{ rowNumber: 1, data: { name: "Item" }, errors: [] }],
      validCount: 1,
      errorCount: 0,
    }

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(previewData),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ importedCount: 1 }),
      } as Response)

    render(<ImportWizard {...defaultProps} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["name\nItem"], "items.csv", { type: "text/csv" })
    Object.defineProperty(fileInput, "files", { value: [file] })
    fireEvent.change(fileInput)

    fireEvent.click(screen.getByText("collectionDetail.importNext"))
    await waitFor(() => screen.getByText("collectionDetail.importConfirmCount:1"))
    fireEvent.click(screen.getByText("collectionDetail.importConfirmCount:1"))
    await waitFor(() => screen.getByText("collectionDetail.importDone"))
    fireEvent.click(screen.getByText("collectionDetail.importDone"))
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("shows error toast on confirm API failure", async () => {
    const previewData = {
      rows: [{ rowNumber: 1, data: { name: "Item" }, errors: [] }],
      validCount: 1,
      errorCount: 0,
    }

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(previewData),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "import failed" }),
      } as Response)

    render(<ImportWizard {...defaultProps} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["name\nItem"], "items.csv", { type: "text/csv" })
    Object.defineProperty(fileInput, "files", { value: [file] })
    fireEvent.change(fileInput)

    fireEvent.click(screen.getByText("collectionDetail.importNext"))
    await waitFor(() => screen.getByText("collectionDetail.importConfirmCount:1"))
    fireEvent.click(screen.getByText("collectionDetail.importConfirmCount:1"))
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("import failed")
    })
  })
})
