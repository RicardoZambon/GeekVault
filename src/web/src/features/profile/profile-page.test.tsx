import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Profile from "./profile-page"

const mockChangeLanguage = vi.fn()
const mockSetTheme = vi.fn()

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({ token: "mock-token", user: { id: "1", email: "a@b.com", displayName: "T" }, isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() }),
}))

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ theme: "system", setTheme: mockSetTheme }),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: mockChangeLanguage },
  }),
}))

vi.mock("framer-motion", () => ({
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock("@/components/ds", async () => {
  const actual = await vi.importActual("@/components/ds")
  return {
    ...actual,
    FadeIn: ({ children }: any) => <div>{children}</div>,
    Select: ({ value, onValueChange, disabled, children }: any) => (
      <select value={value} onChange={(e: any) => onValueChange(e.target.value)} disabled={disabled}>{children}</select>
    ),
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
  }
})

const { toast } = await import("@/components/ds")

const profileData = {
  id: "1",
  email: "test@example.com",
  displayName: "Test User",
  avatar: null,
  bio: "A bio",
  preferredLanguage: "en",
  preferredCurrency: "USD",
}

describe("Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows loading state with skeletons", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}))
    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("renders profile form after loading", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(profileData),
    } as Response)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("profile.title")).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue("Test User")).toBeInTheDocument()
  })

  it("shows toast error on fetch failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({ ok: false } as Response)
    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("profile.fetchError")
    })
  })

  it("saves profile successfully and shows toast", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(profileData) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...profileData, preferredLanguage: "pt" }),
      } as Response)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => screen.getByText("profile.title"))

    fireEvent.click(screen.getByText("profile.save"))
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("profile.saveSuccess")
    })
    expect(mockChangeLanguage).toHaveBeenCalledWith("pt")
  })

  it("shows toast error on save failure", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(profileData) } as Response)
      .mockResolvedValueOnce({ ok: false } as Response)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => screen.getByText("profile.title"))
    fireEvent.click(screen.getByText("profile.save"))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("profile.saveFailed")
    })
  })

  it("shows avatar preview when avatar exists", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...profileData, avatar: "http://img.jpg" }),
    } as Response)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByAltText("profile.avatarLabel")).toBeInTheDocument()
    })
  })

  it("handles avatar upload successfully", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(profileData) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ avatarUrl: "http://new.jpg" }) } as Response)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => screen.getByText("profile.title"))

    const file = new File(["img"], "avatar.png", { type: "image/png" })
    const input = document.querySelector('input[type="file"]')!
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  it("handles avatar upload failure with toast", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(profileData) } as Response)
      .mockResolvedValueOnce({ ok: false } as Response)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => screen.getByText("profile.title"))

    const file = new File(["img"], "avatar.png", { type: "image/png" })
    const input = document.querySelector('input[type="file"]')!
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("profile.avatarFailed")
    })
  })

  it("does not upload when no file selected", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(profileData),
    } as Response)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => screen.getByText("profile.title"))

    const input = document.querySelector('input[type="file"]')!
    fireEvent.change(input, { target: { files: [] } })

    // Only the initial fetch should have been called
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it("saves profile without changing language when language matches", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(profileData) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...profileData, preferredLanguage: "en" }),
      } as Response)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => screen.getByText("profile.title"))

    // Verify form fields are rendered
    expect(screen.getByDisplayValue("Test User")).toBeInTheDocument()
    expect(screen.getByDisplayValue("A bio")).toBeInTheDocument()

    fireEvent.click(screen.getByText("profile.save"))
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("profile.saveSuccess")
    })
    // Language matches "en" so changeLanguage should NOT be called
    expect(mockChangeLanguage).not.toHaveBeenCalled()
  })

  it("renders form fields for language and currency selection", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(profileData),
    } as Response)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => screen.getByText("profile.title"))

    // Check language select - mocked as native <select>
    const selects = document.querySelectorAll("select")
    expect(selects.length).toBeGreaterThanOrEqual(2)

    const langSelect = selects[0]
    expect(langSelect).toHaveValue("en")

    const currSelect = selects[1]
    expect(currSelect).toHaveValue("USD")

    // Change language
    fireEvent.change(langSelect, { target: { value: "pt" } })
    expect(langSelect).toHaveValue("pt")

    // Change currency
    fireEvent.change(currSelect, { target: { value: "BRL" } })
    expect(currSelect).toHaveValue("BRL")
  })

  it("updates display name and bio fields", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(profileData),
    } as Response)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => screen.getByText("profile.title"))

    const nameInput = screen.getByLabelText("profile.displayNameLabel")
    fireEvent.change(nameInput, { target: { value: "New Name" } })
    expect(nameInput).toHaveValue("New Name")

    const bioInput = screen.getByLabelText("profile.bioLabel")
    fireEvent.change(bioInput, { target: { value: "New bio" } })
    expect(bioInput).toHaveValue("New bio")
  })

  it("handles null values in profile data with fallbacks", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: "1",
        email: "test@example.com",
        displayName: null,
        avatar: null,
        bio: null,
        preferredLanguage: null,
        preferredCurrency: null,
      }),
    } as Response)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText("profile.title")).toBeInTheDocument()
    })

    // displayName fallback to ""
    const nameInput = screen.getByLabelText("profile.displayNameLabel")
    expect(nameInput).toHaveValue("")

    // bio fallback to ""
    const bioInput = screen.getByLabelText("profile.bioLabel")
    expect(bioInput).toHaveValue("")

    // language fallback to "en"
    const selects = document.querySelectorAll("select")
    expect(selects[0]).toHaveValue("en")

    // currency fallback to "USD"
    expect(selects[1]).toHaveValue("USD")
  })

  it("triggers file input click when avatar area is clicked", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(profileData),
    } as Response)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => screen.getByText("profile.title"))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, "click")

    // Click the avatar area (the div with cursor-pointer)
    const avatarArea = document.querySelector(".cursor-pointer")!
    fireEvent.click(avatarArea)
    expect(clickSpy).toHaveBeenCalled()
  })

  it("shows email as disabled field", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(profileData),
    } as Response)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => screen.getByText("profile.title"))

    expect(screen.getByDisplayValue("test@example.com")).toBeDisabled()
  })

  it("renders theme section with appearance options", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(profileData),
    } as Response)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => screen.getByText("profile.title"))

    expect(screen.getByText("profile.sections.appearance")).toBeInTheDocument()
    expect(screen.getByText("profile.sections.themeLight")).toBeInTheDocument()
    expect(screen.getByText("profile.sections.themeDark")).toBeInTheDocument()
    expect(screen.getByText("profile.sections.themeSystem")).toBeInTheDocument()
  })

  it("changes theme when theme button is clicked", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(profileData),
    } as Response)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => screen.getByText("profile.title"))

    fireEvent.click(screen.getByText("profile.sections.themeDark"))
    expect(mockSetTheme).toHaveBeenCalledWith("dark")
  })
})
