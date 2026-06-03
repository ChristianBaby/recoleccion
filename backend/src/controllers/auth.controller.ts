import { Request, Response, NextFunction } from 'express'
import * as authService from '../services/auth.service'
import { ok, created } from '../utils/response'

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.registerUser(req.body)
    created(res, null, result.message)
  } catch (err) {
    next(err)
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.verifyEmail(req.body.token)
    ok(res, null, result.message)
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.loginUser(req.body)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.refreshAccessToken(req.body.refreshToken)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await authService.logoutUser(refreshToken)
    }
    ok(res, null, 'Sesión cerrada exitosamente')
  } catch (err) {
    next(err)
  }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.resendVerificationEmail(req.body.email)
    ok(res, null, result.message)
  } catch (err) {
    next(err)
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.forgotPassword(req.body.email)
    ok(res, null, result.message)
  } catch (err) {
    next(err)
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.password)
    ok(res, null, result.message)
  } catch (err) {
    next(err)
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await authService.getProfile(req.user!.id)
    ok(res, profile)
  } catch (err) {
    next(err)
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.updateProfile(req.user!.id, req.body)
    ok(res, result, 'Perfil actualizado correctamente')
  } catch (err) {
    next(err)
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body
    const result = await authService.changePassword(req.user!.id, currentPassword, newPassword)
    ok(res, null, result.message)
  } catch (err) {
    next(err)
  }
}
