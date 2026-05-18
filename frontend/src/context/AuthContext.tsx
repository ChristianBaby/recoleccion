'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import {
  saveSession,
  clearSession,
  getSavedUser,
  getRefreshToken,
  getAccessToken,
  getDashboardPath,
  updateSavedUser,
} from '@/lib/auth'
import type { AuthUser, ApiResponse } from '@/types'

interface LoginData {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  accessToken: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateZone: (zoneId: string | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = getSavedUser()
    const token = getAccessToken()
    if (savedUser && token) {
      setUser(savedUser)
      setAccessToken(token)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<ApiResponse<LoginData>>('/auth/login', { email, password })
    const data = res.data!
    saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user)
    setUser(data.user)
    setAccessToken(data.accessToken)
    router.push(getDashboardPath(data.user.role))
  }, [router])

  const updateZone = useCallback((zoneId: string | null) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, zoneId }
      updateSavedUser({ zoneId })
      return updated
    })
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch {
      // Ignorar error de logout
    }
    clearSession()
    setUser(null)
    setAccessToken(null)
    router.push('/login')
  }, [router])

  // Auto-refresh del access token
  useEffect(() => {
    const interval = setInterval(async () => {
      const refreshToken = getRefreshToken()
      if (!refreshToken || !user) return

      try {
        const res = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          '/auth/refresh',
          { refreshToken },
        )
        const data = res.data!
        saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken }, user)
        setAccessToken(data.accessToken)
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearSession()
          setUser(null)
          setAccessToken(null)
          router.push('/login')
        }
      }
    }, 12 * 60 * 1000) // refrescar cada 12 min (access token dura 15 min)

    return () => clearInterval(interval)
  }, [user, router])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        accessToken,
        login,
        logout,
        updateZone,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
