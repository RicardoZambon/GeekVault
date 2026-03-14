import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface AuthUser {
  id: string
  email: string
  displayName: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'geekvault-token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [isLoading, setIsLoading] = useState(true)

  const clearAuth = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
  }, [])

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then((data) => {
        setUser({ id: data.userId, email: data.email, displayName: data.displayName ?? '' })
      })
      .catch(() => {
        clearAuth()
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [token, clearAuth])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.message ?? 'Login failed')
    }

    const data = await res.json()
    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser({ id: data.userId, email: data.email, displayName: '' })
  }, [])

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.message ?? data?.errors?.join(', ') ?? 'Registration failed')
    }

    const data = await res.json()
    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser({ id: data.userId, email: data.email, displayName })
  }, [])

  const logout = useCallback(() => {
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    clearAuth()
  }, [token, clearAuth])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
