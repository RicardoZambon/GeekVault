import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog"

describe("Dialog", () => {
  it("renders dialog content when open", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <p>Body</p>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText("Title")).toBeInTheDocument()
    expect(screen.getByText("Description")).toBeInTheDocument()
    expect(screen.getByText("Body")).toBeInTheDocument()
  })

  it("does not render content when closed", () => {
    render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Hidden</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument()
  })

  it("renders close button", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Test</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText("Close")).toBeInTheDocument()
  })

  it("applies custom className to header", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader className="custom-header" data-testid="header">
            <DialogTitle>T</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByTestId("header")).toHaveClass("custom-header")
  })
})
