import dotenv from 'dotenv'
dotenv.config()

function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Variable de entorno requerida no definida: ${key}`)
  return value
}

export const env = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isDev: (process.env.NODE_ENV ?? 'development') === 'development',

  frontendUrl: (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/^['"]|['"]$/g, '').trim(),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  brevoApiKey: process.env.BREVO_API_KEY ?? '',
  emailFrom: process.env.EMAIL_FROM ?? 'EcoRutas Cusco <noreply@ecorutas.pe>',
}
