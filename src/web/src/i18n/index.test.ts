import { describe, it, expect, beforeEach } from "vitest"
import i18n from "./index"

describe("i18n", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("supports english and portuguese resources", () => {
    expect(i18n.hasResourceBundle("en", "translation")).toBe(true)
    expect(i18n.hasResourceBundle("pt", "translation")).toBe(true)
  })

  it("has a supported language set", () => {
    expect(["en", "pt"]).toContain(i18n.language)
  })

  it("persists language changes to localStorage", async () => {
    await i18n.changeLanguage("pt")
    expect(localStorage.getItem("geekvault-language")).toBe("pt")
    await i18n.changeLanguage("en")
  })
})
