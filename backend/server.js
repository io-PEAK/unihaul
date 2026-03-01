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
import userRoutes from './src/routes/users.js'
import institutionsRoutes from './src/routes/institutionsRoute.js'

dotenv.config()
const app = express()

app.use(helmet())

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 500,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
})

app.use(generalLimiter)

// ── Routes ────────────────────────────────────────────────────
app.use('/auth',          authLimiter, authRoutes)
app.use('/items',         itemRoutes)
app.use('/messages',      messageRoutes)
app.use('/transactions',  transactionRoutes)
app.use('/cart',          cartRoutes)
app.use('/notifications', notificationRoutes)
app.use('/users',         userRoutes)           // ← was missing
app.use('/institutions',  institutionsRoutes)   // ← was missing

app.get('/', (req, res) => res.json({ message: 'Student Shop API is running!' }))

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }))

app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production'
  console.error(err)
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Something went wrong.',
    ...(isDev && { stack: err.stack }),
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))