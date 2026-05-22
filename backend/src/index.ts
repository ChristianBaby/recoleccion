import 'dotenv/config'
import { createServer } from 'http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import { prisma } from './config/prisma'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'
import { setupSocketServer } from './socket'

const app = express()

// Necesario para que express-rate-limit funcione correctamente detrás de proxies (Railway, Heroku, etc.)
app.set('trust proxy', 1)

// ─── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet())

const allowedOrigins = env.frontendUrl.split(',').map((u) => u.trim()).filter(Boolean)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origen no permitido → ${origin}`))
  },
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

// ─── HTTP Server + Socket.io ──────────────────────────────────────────────────
const httpServer = createServer(app)
setupSocketServer(httpServer, env.frontendUrl)

// ─── Start ────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await prisma.$connect()
    console.log('✅ Conectado a PostgreSQL')

    httpServer.listen(env.port, () => {
      console.log(`🚀 Backend corriendo en http://localhost:${env.port}`)
      console.log(`   WebSocket (Socket.io) activo`)
      console.log(`   Ambiente: ${env.nodeEnv}`)
      console.log(`   Frontend: ${env.frontendUrl}`)
    })
  } catch (error) {
    console.error('❌ Error al iniciar:', error)
    process.exit(1)
  }
}

main()
