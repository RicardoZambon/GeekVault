import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Sheet, SheetContent, SheetTrigger } from "./sheet"

describe("Sheet", () => {
  it("renders content when open", () => {
    render(
      <Sheet open>
        <SheetContent>
          <p>Sheet body</p>
        </SheetContent>
      </Sheet>
    )
    expect(screen.getByText("Sheet body")).toBeInTheDocument()
  })

  it("does not render content when closed", () => {
    render(
      <Sheet open={false}>
        <SheetContent>
          <p>Hidden</p>
        </SheetContent>
      </Sheet>
    )
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument()
  })

  it("renders with left side", () => {
    render(
      <Sheet open>
        <SheetContent side="left">
          <p>Left sheet</p>
        </SheetContent>
      </Sheet>
    )
    expect(screen.getByText("Left sheet")).toBeInTheDocument()
  })

  it("renders with top side", () => {
    render(
      <Sheet open>
        <SheetContent side="top">
          <p>Top sheet</p>
        </SheetContent>
      </Sheet>
    )
    expect(screen.getByText("Top sheet")).toBeInTheDocument()
  })

  it("renders with bottom side", () => {
    render(
      <Sheet open>
        <SheetContent side="bottom">
          <p>Bottom sheet</p>
        </SheetContent>
      </Sheet>
    )
    expect(screen.getByText("Bottom sheet")).toBeInTheDocument()
  })

  it("renders trigger", () => {
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
      </Sheet>
    )
    expect(screen.getByText("Open")).toBeInTheDocument()
  })
})
