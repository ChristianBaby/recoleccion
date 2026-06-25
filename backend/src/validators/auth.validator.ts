import { z } from 'zod'

const passwordRules = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres')
    .trim(),
  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede tener más de 50 caracteres')
    .trim(),
  dni: z
    .string()
    .length(8, 'El DNI debe tener exactamente 8 dígitos')
    .regex(/^\d{8}$/, 'El DNI solo debe contener dígitos'),
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
  password: passwordRules,
  phone: z
    .string()
    .regex(/^(\+?51)?\d{9}$/, 'Número de teléfono inválido (ej: 987654321)')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(200)
    .trim(),
  district: z.string().min(2, 'Seleccione un distrito').trim(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones de privacidad',
  }),
})

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
  password: z.string().min(1, 'Ingrese su contraseña'),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: passwordRules,
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
