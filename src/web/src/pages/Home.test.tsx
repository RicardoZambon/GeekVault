import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import Home from "./Home"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}))

describe("Home", () => {
  it("renders heading and description", () => {
    render(<Home />)
    expect(screen.getByText("app.name")).toBeInTheDocument()
    expect(
      screen.getByText("home.tagline")
    ).toBeInTheDocument()
  })
})
