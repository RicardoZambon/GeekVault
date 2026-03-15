import { describe, it, expect, vi, beforeEach } from "vitest"
import { fetchApi, ApiError } from "./api"

describe("fetchApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it("makes a GET request and returns JSON", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ data: "test" }),
    } as Response)

    const result = await fetchApi("/api/test")
    expect(result).toEqual({ data: "test" })
    expect(global.fetch).toHaveBeenCalledWith("/api/test", expect.objectContaining({}))
  })

  it("adds Authorization header when token exists", async () => {
    localStorage.setItem("geekvault-token", "my-token")
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({}),
    } as Response)

    await fetchApi("/api/test")
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer my-token" }),
      })
    )
  })

  it("does not add Authorization header when no token", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({}),
    } as Response)

    await fetchApi("/api/test")
    const callHeaders = (global.fetch as any).mock.calls[0][1].headers
    expect(callHeaders.Authorization).toBeUndefined()
  })

  it("sets Content-Type for JSON body", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({}),
    } as Response)

    await fetchApi("/api/test", { method: "POST", body: { foo: "bar" } })
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ foo: "bar" }),
      })
    )
  })

  it("does not set Content-Type for FormData body", async () => {
    const formData = new FormData()
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({}),
    } as Response)

    await fetchApi("/api/test", { method: "POST", body: formData })
    const callHeaders = (global.fetch as any).mock.calls[0][1].headers
    expect(callHeaders["Content-Type"]).toBeUndefined()
  })

  it("throws ApiError on non-OK response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({ message: "not found" }),
    } as Response)

    await expect(fetchApi("/api/test")).rejects.toThrow(ApiError)
    try {
      await fetchApi("/api/test")
    } catch (e) {
      // Already thrown above
    }
  })

  it("ApiError includes status and body", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: () => Promise.resolve({ error: "bad" }),
    } as Response)

    try {
      await fetchApi("/api/test")
    } catch (e) {
      const err = e as ApiError
      expect(err.status).toBe(400)
      expect(err.body).toEqual({ error: "bad" })
    }
  })

  it("handles non-JSON error body gracefully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("parse error")),
    } as Response)

    await expect(fetchApi("/api/test")).rejects.toThrow(ApiError)
  })

  it("returns undefined for non-JSON success response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "text/plain" }),
    } as Response)

    const result = await fetchApi("/api/test")
    expect(result).toBeUndefined()
  })

  it("prepends / to endpoints without leading slash", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({}),
    } as Response)

    await fetchApi("api/test")
    expect(global.fetch).toHaveBeenCalledWith("/api/test", expect.anything())
  })
})
