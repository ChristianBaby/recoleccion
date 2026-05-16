const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'

interface FetchOptions extends RequestInit {
  token?: string
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: { field: string; message: string }[],
  ) {
    super(message)
  }
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...init } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${endpoint}`, { ...init, headers })
  const json = await res.json()

  if (!res.ok) {
    throw new ApiError(res.status, json.message ?? 'Error desconocido', json.errors)
  }

  return json
}

export const api = {
  post: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body), token }),

  get: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { method: 'GET', token }),
}
