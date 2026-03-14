import { describe, it, expect, beforeEach } from "vitest"

describe("i18n", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("initializes with english as default", async () => {
    const { default: i18n } = await import("./index")
    expect(i18n.language).toBe("en")
  })

  it("has english and portuguese resources", async () => {
    const { default: i18n } = await import("./index")
    expect(i18n.hasResourceBundle("en", "translation")).toBe(true)
    expect(i18n.hasResourceBundle("pt", "translation")).toBe(true)
  })

  it("persists language changes to localStorage", async () => {
    const { default: i18n } = await import("./index")
    await i18n.changeLanguage("pt")
    expect(localStorage.getItem("geekvault-language")).toBe("pt")
    await i18n.changeLanguage("en")
  })
})
