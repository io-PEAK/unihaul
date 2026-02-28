import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import authRoutes from './src/routes/auth.js'
import itemRoutes from './src/routes/items.js'
import messageRoutes from './src/routes/messages.js'
import transactionRoutes from './src/routes/transactions.js'
import cartRoutes from './src/routes/cart.js'
import notificationRoutes from './src/routes/notifications.js'

dotenv.config()
const app = express()

// ── Security headers ──────────────────────────────────────────
app.use(helmet())

// ── CORS — only allow your frontend origins ───────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,        // set this in .env for production
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman during dev)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ── Rate limiting ─────────────────────────────────────────────
// General: 100 requests per 15 min per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

// Auth: stricter — 10 attempts per 15 min (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
})

app.use(generalLimiter)

// ── Routes ────────────────────────────────────────────────────
app.use('/auth', authLimiter, authRoutes)   // stricter limit on auth
app.use('/items', itemRoutes)
app.use('/messages', messageRoutes)
app.use('/transactions', transactionRoutes)
app.use('/cart', cartRoutes)
app.use('/notifications', notificationRoutes)

// ── Health check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Student Shop API is running!' })
})

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' })
})

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  // Don't leak stack traces in production
  const isDev = process.env.NODE_ENV !== 'production'
  console.error(err)
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Something went wrong.',
    ...(isDev && { stack: err.stack }),
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})