import prisma from '../lib/prisma.js'
import institutions from './institutionsController.js'
const { searchInstitutions } = institutions

const toTitleCase = s => s
  ? s.trim().replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  : null

const userSelect = {
  id: true, firstName: true, lastName: true, email: true,
  phone: true, avatar: true, bio: true,
  institution: true, institutionType: true,
  city: true, state: true,
  saleNotifications: true,
  messageNotifications: true,
  priceDropAlerts: true,
  theme: true,
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
    firstName, lastName, phone, avatar, bio,
    institution, institutionType, city, state,
    saleNotifications, messageNotifications, priceDropAlerts, theme,
  } = req.body

  const validThemes = ['ember', 'midnight', 'chalk']
  if (theme && !validThemes.includes(theme))
    return res.status(400).json({ error: 'Invalid theme.' })

  const validTypes = ['college', 'school']
  if (institutionType && !validTypes.includes(institutionType))
    return res.status(400).json({ error: 'institutionType must be college or school.' })

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(firstName        !== undefined && { firstName: firstName.trim() }),
        ...(lastName         !== undefined && { lastName: lastName.trim() }),
        ...(phone            !== undefined && { phone: phone?.trim() || null }),
        ...(avatar           !== undefined && { avatar }),
        ...(bio              !== undefined && { bio: bio?.trim() || null }),
        ...(institution      !== undefined && { institution: institution?.trim() || null }),
        ...(institutionType  !== undefined && { institutionType }),
        ...(city             !== undefined && { city: toTitleCase(city) || null }),
        ...(state            !== undefined && { state: toTitleCase(state) || null }),
        ...(saleNotifications    !== undefined && { saleNotifications:    Boolean(saleNotifications) }),
        ...(messageNotifications !== undefined && { messageNotifications: Boolean(messageNotifications) }),
        ...(priceDropAlerts      !== undefined && { priceDropAlerts:      Boolean(priceDropAlerts) }),
        ...(theme            !== undefined && { theme }),
        ...(institution?.trim() && { profileComplete: true }),
      },
      select: userSelect,
    })

    // Auto-suggest if institution not in local dataset
    if (institution?.trim()) {
      try {
        const localMatch = searchInstitutions(institution.trim(), 'all', 1)
          .find(i => i.name.toLowerCase() === institution.trim().toLowerCase())
        if (!localMatch) {
          await prisma.suggestedInstitution.upsert({
            where: { name: institution.trim() },
            update: { count: { increment: 1 } },
            create: { name: institution.trim(), city: city?.trim() || '', state: state?.trim() || '', type: institutionType || 'college' }
          })
        }
      } catch {}
    }

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update profile.' })
  }
}

// PUT /users/complete-profile
export const completeProfile = async (req, res) => {
  const { phone, institution, institutionType, city, state } = req.body

  if (!institution?.trim())  return res.status(400).json({ error: 'Institution is required.' })
  if (!institutionType)      return res.status(400).json({ error: 'Institution type is required.' })

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        phone:           phone?.trim() || null,
        institution:     institution.trim(),
        institutionType,
        city:            toTitleCase(city) || null,
        state:           toTitleCase(state) || null,
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

// DELETE /users/account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId
    await prisma.notification.deleteMany({ where: { userId } })
    await prisma.cartItem.deleteMany({ where: { userId } })
    await prisma.message.deleteMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] }
    })
    await prisma.transaction.deleteMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] }
    })
    await prisma.item.deleteMany({ where: { sellerId: userId } })
    await prisma.user.delete({ where: { id: userId } })
    res.json({ message: 'Account deleted.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete account.' })
  }
}
// POST /users/create-password — Google users create a password
export const createPassword = async (req, res) => {
  try {
    const userId = req.user.userId
    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ error: 'Min 8 characters.' })
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'User not found.' })
    const bcrypt = await import('bcrypt')
    const hash = await bcrypt.default.hash(newPassword, 12)
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { password: hash, authProvider: 'both' },
      select: userSelect,
    })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create password.' })
  }
}