import type { AuthUser, AuthTokens } from '@/types'

const ACCESS_KEY = 'ecorutas_access'
const REFRESH_KEY = 'ecorutas_refresh'
const USER_KEY = 'ecorutas_user'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 días en segundos

export function saveSession(tokens: AuthTokens, user: AuthUser) {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  // Cookie para que el middleware de Next.js pueda leerla en el servidor
  document.cookie = `${ACCESS_KEY}=${tokens.accessToken}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_KEY)
}

export function getSavedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function updateSavedUser(updates: Partial<AuthUser>) {
  if (typeof window === 'undefined') return
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return
  try {
    const user = JSON.parse(raw) as AuthUser
    localStorage.setItem(USER_KEY, JSON.stringify({ ...user, ...updates }))
  } catch {
    // ignorar
  }
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  document.cookie = `${ACCESS_KEY}=; path=/; max-age=0; SameSite=Lax`
}

export function getDashboardPath(_role: string): string {
  return '/dashboard'
}
