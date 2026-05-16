export type Role = 'ADMIN' | 'OPERATOR' | 'CITIZEN'

export interface AuthUser {
  id: string
  email: string
  role: Role
  firstName: string
  lastName: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface ApiResponse<T = null> {
  success: boolean
  message?: string
  data?: T
}

export interface ApiError {
  success: false
  message: string
  errors?: { field: string; message: string }[]
}
