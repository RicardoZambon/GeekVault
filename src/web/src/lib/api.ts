const TOKEN_KEY = 'geekvault-token'

export class ApiError extends Error {
  status: number
  body?: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

interface FetchApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

export async function fetchApi<T = unknown>(
  endpoint: string,
  options: FetchApiOptions = {},
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const { body, headers: customHeaders, ...rest } = options

  const headers: Record<string, string> = {
    ...((customHeaders as Record<string, string>) ?? {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, {
    ...rest,
    headers,
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let errorBody: unknown
    try {
      errorBody = await response.json()
    } catch {
      // ignore parse errors
    }
    throw new ApiError(
      `Request failed: ${response.status} ${response.statusText}`,
      response.status,
      errorBody,
    )
  }

  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return response.json() as Promise<T>
  }

  return undefined as T
}
