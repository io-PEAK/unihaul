import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import dotenv from 'dotenv'
dotenv.config()

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage'  // ← required for auth-code flow from browser
)

const userSelect = {
  id: true, firstName: true, lastName: true, email: true,
  phone: true, avatar: true, bio: true,
  institution: true, institutionType: true, city: true, state: true,
  theme: true, profileComplete: true, authProvider: true,
  googleId: true, createdAt: true,
}

export const googleAuth = async (req, res) => {
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'No code provided.' })

  try {
    // Exchange code for tokens
    const { tokens } = await client.getToken(code)
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const {
      sub: googleId,
      email,
      given_name: firstName,
      family_name: lastName,
      picture: avatar,
    } = payload

    // Check by googleId first
    let user = await prisma.user.findFirst({ where: { googleId }, select: userSelect })

    // Merge if same email exists
    if (!user) {
      const existingByEmail = await prisma.user.findUnique({ where: { email } })
      if (existingByEmail) {
        user = await prisma.user.update({
          where: { email },
          data: { googleId, avatar: existingByEmail.avatar || avatar || null },
          select: userSelect,
        })
      }
    }

    // Brand new user
    if (!user) {
      user = await prisma.user.create({
        data: {
          firstName: firstName || '',
          lastName:  lastName  || '',
          email,
          passwordHash:    '',
          googleId,
          authProvider:    'google',
          avatar:          avatar || null,
          profileComplete: false,
        },
        select: userSelect,
      })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, user })
  } catch (err) {
    console.error('[googleAuth]', err)
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Google sign-in failed: ${err.message}`
      : 'Google sign-in failed. Please try again.';
    res.status(401).json({ error: errorMessage })
  }
}

export const linkGoogle = async (req, res) => {
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'No code provided.' })

  try {
    const { tokens } = await client.getToken(code)
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    const { sub: googleId, picture: avatar } = payload

    const alreadyLinked = await prisma.user.findFirst({ where: { googleId } })
    if (alreadyLinked && alreadyLinked.id !== req.user.userId) {
      return res.status(409).json({ error: 'This Google account is already linked to another user.' })
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { googleId, avatar: avatar || undefined },
      select: userSelect,
    })

    res.json(user)
  } catch (err) {
    console.error('[linkGoogle]', err)
    res.status(401).json({ error: 'Failed to link Google account.' })
  }
}

export const unlinkGoogle = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } })

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'Set a password before unlinking Google, otherwise you will be locked out.' })
    }

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: { googleId: null },
      select: userSelect,
    })

    res.json(updated)
  } catch (err) {
    console.error('[unlinkGoogle]', err)
    res.status(500).json({ error: 'Failed to unlink Google account.' })
  }
}