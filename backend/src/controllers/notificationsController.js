import prisma from '../lib/prisma.js'

// GET /notifications — get unseen notifications for logged-in user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId
    const notifications = await prisma.notification.findMany({
      where: { userId, seen: false },
      include: { item: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(notifications)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch notifications.' })
  }
}

// POST /notifications/mark-seen — mark all as seen (called when visiting Dashboard)
export const markNotificationsSeen = async (req, res) => {
  try {
    const userId = req.user.userId
    await prisma.notification.updateMany({
      where: { userId, seen: false },
      data: { seen: true },
    })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to mark notifications seen.' })
  }
}