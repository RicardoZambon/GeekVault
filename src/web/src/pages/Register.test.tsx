import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Register from "./Register"

const mockRegister = vi.fn()
const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
    token: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}))

describe("Register", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderRegister() {
    return render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )
  }

  it("renders form fields", () => {
    renderRegister()
    expect(screen.getByLabelText("auth.displayName")).toBeInTheDocument()
    expect(screen.getByLabelText("auth.email")).toBeInTheDocument()
    expect(screen.getByLabelText("auth.password")).toBeInTheDocument()
  })

  it("shows error when display name is empty", () => {
    renderRegister()
    fireEvent.click(screen.getByRole("button", { name: "auth.register" }))
    expect(screen.getByText("auth.displayNameRequired")).toBeInTheDocument()
  })

  it("shows error when email is empty", () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText("auth.displayName"), {
      target: { value: "Test" },
    })
    fireEvent.click(screen.getByRole("button", { name: "auth.register" }))
    expect(screen.getByText("auth.emailRequired")).toBeInTheDocument()
  })

  it("shows error when password is empty", () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText("auth.displayName"), {
      target: { value: "Test" },
    })
    fireEvent.change(screen.getByLabelText("auth.email"), {
      target: { value: "a@b.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "auth.register" }))
    expect(screen.getByText("auth.passwordRequired")).toBeInTheDocument()
  })

  it("shows error when password is too short", () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText("auth.displayName"), {
      target: { value: "Test" },
    })
    fireEvent.change(screen.getByLabelText("auth.email"), {
      target: { value: "a@b.com" },
    })
    fireEvent.change(screen.getByLabelText("auth.password"), {
      target: { value: "12345" },
    })
    fireEvent.click(screen.getByRole("button", { name: "auth.register" }))
    expect(screen.getByText("auth.passwordTooShort")).toBeInTheDocument()
  })

  it("calls register and navigates on success", async () => {
    mockRegister.mockResolvedValueOnce(undefined)
    renderRegister()
    fireEvent.change(screen.getByLabelText("auth.displayName"), {
      target: { value: "Test User" },
    })
    fireEvent.change(screen.getByLabelText("auth.email"), {
      target: { value: "a@b.com" },
    })
    fireEvent.change(screen.getByLabelText("auth.password"), {
      target: { value: "password123" },
    })
    fireEvent.click(screen.getByRole("button", { name: "auth.register" }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("a@b.com", "password123", "Test User")
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true })
    })
  })

  it("shows error on register failure", async () => {
    mockRegister.mockRejectedValueOnce(new Error("Email taken"))
    renderRegister()
    fireEvent.change(screen.getByLabelText("auth.displayName"), {
      target: { value: "Test" },
    })
    fireEvent.change(screen.getByLabelText("auth.email"), {
      target: { value: "a@b.com" },
    })
    fireEvent.change(screen.getByLabelText("auth.password"), {
      target: { value: "password123" },
    })
    fireEvent.click(screen.getByRole("button", { name: "auth.register" }))

    expect(await screen.findByText("Email taken")).toBeInTheDocument()
  })

  it("shows generic error for non-Error exceptions", async () => {
    mockRegister.mockRejectedValueOnce("whoops")
    renderRegister()
    fireEvent.change(screen.getByLabelText("auth.displayName"), {
      target: { value: "Test" },
    })
    fireEvent.change(screen.getByLabelText("auth.email"), {
      target: { value: "a@b.com" },
    })
    fireEvent.change(screen.getByLabelText("auth.password"), {
      target: { value: "password123" },
    })
    fireEvent.click(screen.getByRole("button", { name: "auth.register" }))

    expect(await screen.findByText("auth.registerFailed")).toBeInTheDocument()
  })

  it("has link to login page", () => {
    renderRegister()
    expect(screen.getByText("auth.loginLink")).toHaveAttribute("href", "/login")
  })
})
