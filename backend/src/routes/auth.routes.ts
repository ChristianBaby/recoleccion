import { Router } from 'express'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import * as ctrl from '../controllers/auth.controller'
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../validators/auth.validator'

const router = Router()

// RF-01
router.post('/register', validate(registerSchema), ctrl.register)
router.post('/verify-email', validate(verifyEmailSchema), ctrl.verifyEmail)
router.post('/resend-verification', validate(forgotPasswordSchema), ctrl.resendVerification)

// RF-02
router.post('/login', validate(loginSchema), ctrl.login)
router.post('/refresh', validate(refreshTokenSchema), ctrl.refresh)
router.post('/logout', ctrl.logout)
router.post('/forgot-password', validate(forgotPasswordSchema), ctrl.forgotPassword)
router.post('/reset-password', validate(resetPasswordSchema), ctrl.resetPassword)

// Rutas protegidas de perfil
router.get('/me', requireAuth, ctrl.me)
router.patch('/me/profile', requireAuth, ctrl.updateProfile)
router.patch('/me/password', requireAuth, ctrl.changePassword)

export default router
