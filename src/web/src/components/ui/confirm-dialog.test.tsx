import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ConfirmDialog } from "./confirm-dialog"

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: "Delete Item",
    description: "Are you sure?",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    onConfirm: vi.fn(),
  }

  it("renders title, description, and buttons when open", () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByText("Delete Item")).toBeInTheDocument()
    expect(screen.getByText("Are you sure?")).toBeInTheDocument()
    expect(screen.getByText("Delete")).toBeInTheDocument()
    expect(screen.getByText("Cancel")).toBeInTheDocument()
  })

  it("does not render when closed", () => {
    render(<ConfirmDialog {...defaultProps} open={false} />)
    expect(screen.queryByText("Delete Item")).not.toBeInTheDocument()
  })

  it("calls onConfirm when confirm button clicked", () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText("Delete"))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("calls onOpenChange(false) when cancel button clicked", () => {
    const onOpenChange = vi.fn()
    render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />)
    fireEvent.click(screen.getByText("Cancel"))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("shows loading label when loading", () => {
    render(<ConfirmDialog {...defaultProps} loading={true} loadingLabel="Deleting..." />)
    expect(screen.getByText("Deleting...")).toBeInTheDocument()
    expect(screen.queryByText("Delete")).not.toBeInTheDocument()
  })

  it("disables buttons when loading", () => {
    render(<ConfirmDialog {...defaultProps} loading={true} loadingLabel="Deleting..." />)
    expect(screen.getByText("Deleting...")).toBeDisabled()
    expect(screen.getByText("Cancel")).toBeDisabled()
  })

  it("uses destructive variant by default", () => {
    render(<ConfirmDialog {...defaultProps} />)
    const confirmBtn = screen.getByText("Delete")
    expect(confirmBtn.className).toContain("destructive")
  })
})
