import prisma from '../lib/prisma.js'

// GET /notifications — get unseen notifications for logged-in user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId
    const notifications = await prisma.notification.findMany({
      where: { userId, seen: false },
      orderBy: { createdAt: 'desc' },
    })
    // Return itemId directly — don't include item relation (item may be deleted)
    res.json(notifications.map(n => ({
      id: n.id,
      itemId: n.itemId,
      buyerName: n.buyerName,
      price: n.price,
      seen: n.seen,
      createdAt: n.createdAt,
    })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch notifications.' })
  }
}

// POST /notifications/mark-seen — mark all as seen
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