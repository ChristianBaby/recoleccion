import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import { prisma } from './config/prisma'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'

const app = express()

// ─── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
}))

// Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Demasiadas solicitudes. Intenta en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
}))

// Rate limiting estricto para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Demasiados intentos de autenticación. Intenta en 15 minutos.' },
})
app.use('/api/v1/auth/login', authLimiter)
app.use('/api/v1/auth/register', authLimiter)
app.use('/api/v1/auth/forgot-password', authLimiter)

// ─── Body Parser ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', routes)

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler)

// ─── Start ────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await prisma.$connect()
    console.log('✅ Conectado a PostgreSQL')

    app.listen(env.port, () => {
      console.log(`🚀 Backend corriendo en http://localhost:${env.port}`)
      console.log(`   Ambiente: ${env.nodeEnv}`)
      console.log(`   Frontend: ${env.frontendUrl}`)
    })
  } catch (error) {
    console.error('❌ Error al iniciar:', error)
    process.exit(1)
  }
}

main()
