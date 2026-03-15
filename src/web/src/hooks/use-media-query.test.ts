import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useMediaQuery } from "./use-media-query"

describe("useMediaQuery", () => {
  let listeners: Map<string, ((e: MediaQueryListEvent) => void)[]>
  let mockMatches: Map<string, boolean>

  beforeEach(() => {
    listeners = new Map()
    mockMatches = new Map()

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => {
        if (!listeners.has(query)) listeners.set(query, [])
        return {
          matches: mockMatches.get(query) ?? false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: (_: string, handler: any) => {
            listeners.get(query)!.push(handler)
          },
          removeEventListener: (_: string, handler: any) => {
            const arr = listeners.get(query)!
            const idx = arr.indexOf(handler)
            if (idx >= 0) arr.splice(idx, 1)
          },
          dispatchEvent: vi.fn(),
        }
      },
    })
  })

  it("returns false when query does not match", () => {
    mockMatches.set("(min-width: 1024px)", false)
    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"))
    expect(result.current).toBe(false)
  })

  it("returns true when query matches", () => {
    mockMatches.set("(min-width: 1024px)", true)
    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"))
    expect(result.current).toBe(true)
  })

  it("updates when media query changes", () => {
    mockMatches.set("(min-width: 1024px)", false)
    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"))
    expect(result.current).toBe(false)

    act(() => {
      const handlers = listeners.get("(min-width: 1024px)")!
      handlers.forEach((h) => h({ matches: true } as MediaQueryListEvent))
    })
    expect(result.current).toBe(true)
  })
})
