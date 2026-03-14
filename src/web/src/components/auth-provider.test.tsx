import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { AuthProvider, useAuth } from "./auth-provider"

function AuthConsumer() {
  const { user, token, isLoading, login, register, logout } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="token">{token ?? "null"}</span>
      <span data-testid="user">{user?.email ?? "null"}</span>
      <button onClick={() => login("a@b.com", "pass")}>Login</button>
      <button onClick={() => register("a@b.com", "pass", "Name")}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it("starts loading, then finishes when no token", async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    })
    expect(screen.getByTestId("token")).toHaveTextContent("null")
  })

  it("validates existing token on mount", async () => {
    localStorage.setItem("geekvault-token", "existing-token")
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ userId: "1", email: "test@test.com", displayName: "Test" }),
    } as Response)

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("test@test.com")
    })
  })

  it("clears auth when token validation fails", async () => {
    localStorage.setItem("geekvault-token", "bad-token")
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
    } as Response)

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("token")).toHaveTextContent("null")
    })
    expect(localStorage.getItem("geekvault-token")).toBeNull()
  })

  it("handles login successfully", async () => {
    let callCount = 0
    vi.spyOn(global, "fetch").mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // login POST
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: "new-token", userId: "1", email: "a@b.com" }),
        } as Response)
      }
      // /api/auth/me after token set
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ userId: "1", email: "a@b.com", displayName: "Test" }),
      } as Response)
    })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    })

    await act(async () => {
      fireEvent.click(screen.getByText("Login"))
    })

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("a@b.com")
    })
  })

  it("handles login failure with message", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Bad credentials" }),
    } as Response)

    let loginError = ""
    function LoginTest() {
      const { login } = useAuth()
      return (
        <button
          onClick={async () => {
            try {
              await login("a@b.com", "pass")
            } catch (e) {
              loginError = (e as Error).message
            }
          }}
        >
          Login
        </button>
      )
    }

    render(
      <AuthProvider>
        <LoginTest />
      </AuthProvider>
    )

    await act(async () => {
      fireEvent.click(screen.getByText("Login"))
    })

    expect(loginError).toBe("Bad credentials")
  })

  it("handles login failure with non-json response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      json: () => Promise.reject(new Error("not json")),
    } as Response)

    let loginError = ""
    function LoginTest() {
      const { login } = useAuth()
      return (
        <button
          onClick={async () => {
            try {
              await login("a@b.com", "pass")
            } catch (e) {
              loginError = (e as Error).message
            }
          }}
        >
          Login
        </button>
      )
    }

    render(
      <AuthProvider>
        <LoginTest />
      </AuthProvider>
    )

    await act(async () => {
      fireEvent.click(screen.getByText("Login"))
    })

    expect(loginError).toBe("Login failed")
  })

  it("handles register successfully", async () => {
    let callCount = 0
    vi.spyOn(global, "fetch").mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: "reg-token", userId: "2", email: "a@b.com" }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ userId: "2", email: "a@b.com", displayName: "Name" }),
      } as Response)
    })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    })

    await act(async () => {
      fireEvent.click(screen.getByText("Register"))
    })

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("a@b.com")
    })
  })

  it("handles register failure with errors array", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ errors: ["Email taken", "Weak password"] }),
    } as Response)

    let regError = ""
    function RegisterTest() {
      const { register } = useAuth()
      return (
        <button
          onClick={async () => {
            try {
              await register("a@b.com", "123", "Name")
            } catch (e) {
              regError = (e as Error).message
            }
          }}
        >
          Reg
        </button>
      )
    }

    render(
      <AuthProvider>
        <RegisterTest />
      </AuthProvider>
    )

    await act(async () => {
      fireEvent.click(screen.getByText("Reg"))
    })

    expect(regError).toBe("Email taken, Weak password")
  })

  it("handles register failure with non-json response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      json: () => Promise.reject(new Error("not json")),
    } as Response)

    let regError = ""
    function RegisterTest() {
      const { register } = useAuth()
      return (
        <button
          onClick={async () => {
            try {
              await register("a@b.com", "pass", "Name")
            } catch (e) {
              regError = (e as Error).message
            }
          }}
        >
          Reg
        </button>
      )
    }

    render(
      <AuthProvider>
        <RegisterTest />
      </AuthProvider>
    )

    await act(async () => {
      fireEvent.click(screen.getByText("Reg"))
    })

    expect(regError).toBe("Registration failed")
  })

  it("handles logout", async () => {
    localStorage.setItem("geekvault-token", "tok")
    let callCount = 0
    vi.spyOn(global, "fetch").mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // /api/auth/me validation
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ userId: "1", email: "a@b.com", displayName: "T" }),
        } as Response)
      }
      // logout POST
      return Promise.resolve({ ok: true } as Response)
    })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("a@b.com")
    })

    act(() => {
      fireEvent.click(screen.getByText("Logout"))
    })

    expect(screen.getByTestId("token")).toHaveTextContent("null")
    expect(localStorage.getItem("geekvault-token")).toBeNull()
  })
})

describe("AuthProvider displayName fallback", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it("uses empty string when displayName is null in /me response", async () => {
    localStorage.setItem("geekvault-token", "tok")
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ userId: "1", email: "test@test.com", displayName: null }),
    } as Response)

    function Consumer() {
      const { user } = useAuth()
      return <span data-testid="name">{user?.displayName ?? "NULL"}</span>
    }

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("name")).toHaveTextContent("")
    })
  })

  it("calls clearAuth on logout without making API call when token is falsy", async () => {
    // Start without a token
    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    )

    function LogoutConsumer() {
      const { logout, token } = useAuth()
      return (
        <div>
          <span data-testid="token">{token ?? "null"}</span>
          <button onClick={logout}>Logout</button>
        </div>
      )
    }

    render(
      <AuthProvider>
        <LogoutConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("token")).toHaveTextContent("null")
    })

    // Logout with no token - should not call fetch for /api/auth/logout
    const fetchSpy = vi.spyOn(global, "fetch")
    fetchSpy.mockClear()

    act(() => {
      fireEvent.click(screen.getByText("Logout"))
    })

    // No fetch call to /api/auth/logout since token is null
    const logoutCalls = fetchSpy.mock.calls.filter(
      (call) => String(call[0]).includes("/auth/logout")
    )
    expect(logoutCalls.length).toBe(0)
  })
})

describe("useAuth outside provider", () => {
  it("throws when used outside AuthProvider", () => {
    // Suppress console.error from React error boundary
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    function BadConsumer() {
      useAuth()
      return null
    }

    expect(() => render(<BadConsumer />)).toThrow(
      "useAuth must be used within an AuthProvider"
    )
    consoleSpy.mockRestore()
  })
})
