import prisma from '../lib/prisma.js'

// GET /notifications — unseen only (for badge count)
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId
    const notifications = await prisma.notification.findMany({
      where: { userId, seen: false },
      orderBy: { createdAt: 'desc' },
    })
    res.json(notifications.map(n => ({
      id: n.id,
      itemId: n.itemId,
      itemTitle: n.itemTitle,
      buyerName: n.buyerName,
      price: n.price,
      oldPrice: n.oldPrice || null,
      type: n.type || 'sale',
      seen: n.seen,
      createdAt: n.createdAt,
    })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch notifications.' })
  }
}

// GET /notifications/all — all notifications (for dropdown list, last 30)
export const getAllNotifications = async (req, res) => {
  try {
    const userId = req.user.userId
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    res.json(notifications.map(n => ({
      id: n.id,
      itemId: n.itemId,
      itemTitle: n.itemTitle,
      buyerName: n.buyerName,
      price: n.price,
      oldPrice: n.oldPrice || null,
      type: n.type || 'sale',
      seen: n.seen,
      createdAt: n.createdAt,
    })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch all notifications.' })
  }
}

// POST /notifications/mark-seen — mark all unseen as seen
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

// DELETE /notifications/:id — delete a single notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId
    const notifId = parseInt(req.params.id)
    const notif = await prisma.notification.findUnique({ where: { id: notifId } })
    if (!notif) return res.status(404).json({ error: 'Notification not found.' })
    if (notif.userId !== userId) return res.status(403).json({ error: 'Not authorised.' })
    await prisma.notification.delete({ where: { id: notifId } })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete notification.' })
  }
}

// DELETE /notifications — clear all notifications for user
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.userId
    await prisma.notification.deleteMany({ where: { userId } })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to clear notifications.' })
  }
}