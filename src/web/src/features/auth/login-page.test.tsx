import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Login from "./login-page"

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

vi.mock("framer-motion", () => ({
  motion: { div: ({ children, ...props }: any) => { const { whileHover, whileTap, ...rest } = props; return <div {...rest}>{children}</div> } },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock("@/components/ds", async () => {
  const actual = await vi.importActual("@/components/ds")
  return {
    ...actual,
    FadeIn: ({ children }: any) => <div>{children}</div>,
    ScaleIn: ({ children }: any) => <div>{children}</div>,
  }
})

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
    expect(screen.getByTestId("auth-submit")).toBeInTheDocument()
  })

  it("renders welcome back title", () => {
    renderLogin()
    expect(screen.getByText("auth.welcomeBack")).toBeInTheDocument()
    expect(screen.getByText("auth.loginDescription")).toBeInTheDocument()
  })

  it("shows error when email is empty", async () => {
    renderLogin()
    fireEvent.click(screen.getByTestId("auth-submit"))
    expect(await screen.findByText("auth.emailRequired")).toBeInTheDocument()
  })

  it("shows error when password is empty", async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText("auth.email"), {
      target: { value: "test@test.com" },
    })
    fireEvent.click(screen.getByTestId("auth-submit"))
    expect(await screen.findByText("auth.passwordRequired")).toBeInTheDocument()
  })

  it("shows error in styled error banner", async () => {
    renderLogin()
    fireEvent.click(screen.getByTestId("auth-submit"))
    await waitFor(() => {
      expect(screen.getByTestId("auth-error")).toBeInTheDocument()
    })
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
    fireEvent.click(screen.getByTestId("auth-submit"))

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
    fireEvent.click(screen.getByTestId("auth-submit"))

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
    fireEvent.click(screen.getByTestId("auth-submit"))

    expect(await screen.findByText("auth.loginFailed")).toBeInTheDocument()
  })

  it("has link to register page", () => {
    renderLogin()
    const link = screen.getByTestId("auth-register-link")
    expect(link).toHaveAttribute("href", "/register")
    expect(link).toHaveTextContent("auth.registerLink")
  })

  it("uses accent color for register link", () => {
    renderLogin()
    const link = screen.getByTestId("auth-register-link")
    expect(link.className).toContain("text-accent")
  })
})
