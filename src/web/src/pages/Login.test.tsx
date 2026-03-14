import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Login from "./Login"

const mockLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    token: null,
    isLoading: false,
    register: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}))

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderLogin() {
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
  }

  it("renders form fields", () => {
    renderLogin()
    expect(screen.getByLabelText("auth.email")).toBeInTheDocument()
    expect(screen.getByLabelText("auth.password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "auth.login" })).toBeInTheDocument()
  })

  it("shows error when email is empty", async () => {
    renderLogin()
    fireEvent.click(screen.getByRole("button", { name: "auth.login" }))
    expect(await screen.findByText("auth.emailRequired")).toBeInTheDocument()
  })

  it("shows error when password is empty", async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText("auth.email"), {
      target: { value: "test@test.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "auth.login" }))
    expect(await screen.findByText("auth.passwordRequired")).toBeInTheDocument()
  })

  it("calls login and navigates on success", async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    renderLogin()
    fireEvent.change(screen.getByLabelText("auth.email"), {
      target: { value: "test@test.com" },
    })
    fireEvent.change(screen.getByLabelText("auth.password"), {
      target: { value: "password123" },
    })
    fireEvent.click(screen.getByRole("button", { name: "auth.login" }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@test.com", "password123")
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true })
    })
  })

  it("shows error on login failure", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"))
    renderLogin()
    fireEvent.change(screen.getByLabelText("auth.email"), {
      target: { value: "test@test.com" },
    })
    fireEvent.change(screen.getByLabelText("auth.password"), {
      target: { value: "wrong" },
    })
    fireEvent.click(screen.getByRole("button", { name: "auth.login" }))

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument()
  })

  it("shows generic error for non-Error exceptions", async () => {
    mockLogin.mockRejectedValueOnce("string error")
    renderLogin()
    fireEvent.change(screen.getByLabelText("auth.email"), {
      target: { value: "test@test.com" },
    })
    fireEvent.change(screen.getByLabelText("auth.password"), {
      target: { value: "pass" },
    })
    fireEvent.click(screen.getByRole("button", { name: "auth.login" }))

    expect(await screen.findByText("auth.loginFailed")).toBeInTheDocument()
  })

  it("has link to register page", () => {
    renderLogin()
    expect(screen.getByText("auth.registerLink")).toHaveAttribute("href", "/register")
  })
})
