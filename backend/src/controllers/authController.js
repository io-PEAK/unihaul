import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import dotenv from 'dotenv'

dotenv.config()

// Fields we always return for the logged-in user
const userSelect = {
  id: true, name: true, email: true,
  phone: true, avatar: true, bio: true,
  institution: true, institutionType: true,
  city: true, state: true,
  notificationsEnabled: true, theme: true,
  profileComplete: true, authProvider: true,
  createdAt: true,
}

function createToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// ── REGISTER ──────────────────────────────────────────────────
export const register = async (req, res) => {
  const { name, email, password } = req.body

  // Basic validation
  if (!name?.trim())     return res.status(400).json({ error: 'Name is required.' })
  if (!email?.trim())    return res.status(400).json({ error: 'Email is required.' })
  if (!password)         return res.status(400).json({ error: 'Password is required.' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' })

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email address.' })

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) return res.status(400).json({ error: 'Email already registered.' })

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: hashedPassword,
        profileComplete: true,  // local signup = profile complete
        authProvider: 'local',
      },
      select: userSelect,
    })

    const token = createToken(user)
    res.status(201).json({ token, user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error during registration.' })
  }
}

// ── LOGIN ─────────────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body

  if (!email?.trim())  return res.status(400).json({ error: 'Email is required.' })
  if (!password)       return res.status(400).json({ error: 'Password is required.' })

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { ...userSelect, passwordHash: true },
    })

    if (!user) return res.status(400).json({ error: 'Invalid email or password.' })

    // Block Google OAuth users from logging in with password
    if (user.authProvider !== 'local') {
      return res.status(400).json({ error: `This account uses ${user.authProvider} sign-in.` })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(400).json({ error: 'Invalid email or password.' })

    const { passwordHash, ...userWithoutPassword } = user
    const token = createToken(user)
    res.json({ token, user: userWithoutPassword })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error during login.' })
  }
}