import prisma from '../lib/prisma.js'

const userSelect = {
  id: true, name: true, email: true,
  phone: true, avatar: true, bio: true,
  institution: true, institutionType: true,
  city: true, state: true,
  notificationsEnabled: true, theme: true,
  profileComplete: true, authProvider: true,
  createdAt: true,
}

// GET /users/me
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: userSelect,
    })
    if (!user) return res.status(404).json({ error: 'User not found.' })
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch profile.' })
  }
}

// PUT /users/profile
export const updateProfile = async (req, res) => {
  const {
    name, phone, avatar, bio,
    institution, institutionType, city, state,
    notificationsEnabled, theme,
  } = req.body

  // Validate theme if provided
  const validThemes = ['ember', 'midnight', 'chalk']
  if (theme && !validThemes.includes(theme))
    return res.status(400).json({ error: 'Invalid theme.' })

  // Validate institutionType if provided
  const validTypes = ['college', 'school']
  if (institutionType && !validTypes.includes(institutionType))
    return res.status(400).json({ error: 'institutionType must be college or school.' })

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(name              !== undefined && { name: name.trim() }),
        ...(phone             !== undefined && { phone: phone?.trim() || null }),
        ...(avatar            !== undefined && { avatar }),
        ...(bio               !== undefined && { bio: bio?.trim() || null }),
        ...(institution       !== undefined && { institution: institution?.trim() || null }),
        ...(institutionType   !== undefined && { institutionType }),
        ...(city              !== undefined && { city: city?.trim() || null }),
        ...(state             !== undefined && { state: state?.trim() || null }),
        ...(notificationsEnabled !== undefined && { notificationsEnabled: Boolean(notificationsEnabled) }),
        ...(theme             !== undefined && { theme }),
        // Mark profile complete if institution is being set
        ...(institution?.trim() && { profileComplete: true }),
      },
      select: userSelect,
    })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update profile.' })
  }
}

// PUT /users/complete-profile  (used after OAuth signup)
export const completeProfile = async (req, res) => {
  const { phone, institution, institutionType, city, state } = req.body

  if (!institution?.trim())   return res.status(400).json({ error: 'Institution is required.' })
  if (!institutionType)       return res.status(400).json({ error: 'Institution type is required.' })

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        phone:           phone?.trim() || null,
        institution:     institution.trim(),
        institutionType,
        city:            city?.trim() || null,
        state:           state?.trim() || null,
        profileComplete: true,
      },
      select: userSelect,
    })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to complete profile.' })
  }
}