import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import Home from "./Home"

describe("Home", () => {
  it("renders heading and description", () => {
    render(<Home />)
    expect(screen.getByText("GeekVault")).toBeInTheDocument()
    expect(
      screen.getByText("Catalog, track, and browse your collectibles.")
    ).toBeInTheDocument()
  })
})
