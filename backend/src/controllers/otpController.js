import 'dotenv/config'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { PrismaClient } = require('/Users/peakmac/github/student-shop/database/node_modules/@prisma/client/default.js')
import { PrismaPg } from '@prisma/adapter-pg'
import pkg from 'pg'
const { Pool } = pkg
import bcrypt from 'bcrypt'
import { sendOtpEmail } from '../lib/email.js'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ── Generate 6-digit OTP ──────────────────────────────────────
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ── POST /users/send-otp ──────────────────────────────────────
// type: "email_change" | "password_reset"
export async function sendOtp(req, res) {
  try {
    const { type } = req.body
    const userId = req.user.id

    if (!['email_change', 'password_reset'].includes(type)) {
      return res.status(400).json({ error: 'Invalid OTP type' })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Block OAuth users from changing password
    if (type === 'password_reset' && user.authProvider !== 'local') {
      return res.status(400).json({ error: 'OAuth accounts cannot change password here. Use Google to manage your password.' })
    }

    // Invalidate any existing unused OTPs of same type
    await prisma.otpCode.updateMany({
      where: { userId, type, used: false },
      data: { used: true },
    })

    const code = generateOtp()
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000) // 3 minutes

    await prisma.otpCode.create({
      data: { userId, code, type, expiresAt },
    })

    await sendOtpEmail({ to: user.email, otp: code, type })

    res.json({ message: `OTP sent to ${user.email}` })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to send OTP' })
  }
}

// ── POST /users/change-email ──────────────────────────────────
export async function changeEmail(req, res) {
  try {
    const { otp, newEmail } = req.body
    const userId = req.user.id

    if (!otp || !newEmail) {
      return res.status(400).json({ error: 'OTP and new email are required' })
    }

    const normalizedEmail = newEmail.trim().toLowerCase()

    // Check email not already taken
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) return res.status(400).json({ error: 'This email is already in use' })

    // Verify OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId,
        type: 'email_change',
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otpRecord) return res.status(400).json({ error: 'OTP expired or not found. Request a new one.' })
    if (otpRecord.code !== otp) return res.status(400).json({ error: 'Incorrect OTP' })

    // Mark OTP used + update email
    await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { used: true } })
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { email: normalizedEmail },
      select: {
        id: true, name: true, email: true, phone: true, avatar: true, bio: true,
        institution: true, institutionType: true, city: true, state: true,
        theme: true, authProvider: true, profileComplete: true,
        notificationsEnabled: true, saleNotifications: true, messageNotifications: true,
        createdAt: true,
      },
    })

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to change email' })
  }
}

// ── POST /users/change-password ───────────────────────────────
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.id

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' })
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.authProvider !== 'local') {
      return res.status(400).json({ error: 'OAuth accounts cannot change password here' })
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' })

    const hash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } })

    res.json({ message: 'Password changed successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to change password' })
  }
}

// ── POST /users/reset-password ────────────────────────────────
// For when user forgets current password — verify OTP then set new password
export async function resetPasswordWithOtp(req, res) {
  try {
    const { otp, newPassword } = req.body
    const userId = req.user.id

    if (!otp || !newPassword) {
      return res.status(400).json({ error: 'OTP and new password are required' })
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId,
        type: 'password_reset',
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otpRecord) return res.status(400).json({ error: 'OTP expired or not found. Request a new one.' })
    if (otpRecord.code !== otp) return res.status(400).json({ error: 'Incorrect OTP' })

    await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { used: true } })

    const hash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } })

    res.json({ message: 'Password reset successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to reset password' })
  }
}