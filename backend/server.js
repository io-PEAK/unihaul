import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './src/routes/auth.js'
import itemRoutes from './src/routes/items.js'
import messageRoutes from './src/routes/messages.js'
import transactionRoutes from './src/routes/transactions.js'
import cartRoutes from './src/routes/cart.js'
import notificationRoutes from './src/routes/notifications.js'

dotenv.config()
const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/auth', authRoutes)
app.use('/items', itemRoutes)
app.use('/messages', messageRoutes)
app.use('/transactions', transactionRoutes)
app.use('/cart', cartRoutes)
app.use('/notifications', notificationRoutes)

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Student Shop API is running!' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})