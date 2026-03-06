import prisma from '../lib/prisma.js'
import { io } from '../../server.js'

// GET /messages/conversations
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        item: { select: { id: true, title: true, status: true, sellerId: true, images: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const convoMap = new Map()
    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender
      const key = `${msg.itemId}-${otherUser.id}`
      if (!convoMap.has(key)) {
        convoMap.set(key, {
          conversation_id: key,
          item_id: msg.itemId,
          item_title: msg.item?.title || 'Item',
          item_status: msg.item?.status || 'available',
          item_seller_id: msg.item?.sellerId || null,
          item_image: msg.item?.images?.[0] || null,
          other_user_id: otherUser.id,
          other_user_name: `${otherUser.firstName} ${otherUser.lastName}`.trim(),
          other_user_avatar: otherUser.avatar || null,
          last_message: msg.content,
          last_message_at: msg.createdAt,
          unread_count: (!msg.read && msg.receiverId === userId) ? 1 : 0,
        })
      } else {
        const existing = convoMap.get(key)
        if (!msg.read && msg.receiverId === userId) {
          existing.unread_count = (existing.unread_count || 0) + 1
        }
      }
    }
    res.json(Array.from(convoMap.values()))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get conversations' })
  }
}

// GET /messages/:itemId?otherUserId=
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.userId
    const itemId = parseInt(req.params.itemId)
    const otherUserId = parseInt(req.query.otherUserId)

    const messages = await prisma.message.findMany({
      where: {
        itemId,
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ]
      },
      orderBy: { createdAt: 'asc' },
    })

    await prisma.message.updateMany({
      where: {
        itemId,
        senderId: otherUserId,
        receiverId: userId,
        read: false,
      },
      data: { read: true }
    })

    res.json(messages)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get messages' })
  }
}

// POST /messages
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, itemId, content } = req.body
    if (!receiverId || !itemId || !content?.trim()) {
      return res.status(400).json({ error: 'receiverId, itemId, and content are required' })
    }
    const message = await prisma.message.create({
      data: {
        senderId: req.user.userId,
        receiverId: parseInt(receiverId),
        itemId: parseInt(itemId),
        content: content.trim(),
        read: false,
      }
    })

    // ── Enrich payload for Navbar notification (no extra query cost — parallel) ──
    const [sender, item] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.userId }, select: { firstName: true, lastName: true, avatar: true } }),
      prisma.item.findUnique({ where: { id: parseInt(itemId) }, select: { title: true } }),
    ])
    const richMessage = {
      ...message,
      senderName: sender ? `${sender.firstName} ${sender.lastName}`.trim() : '',
      senderAvatar: sender?.avatar || null,
      itemTitle: item?.title || '',
    }

    // ── Push new message in real time via socket ───────────
    const onlineUsers = io?._onlineUsers
    if (onlineUsers) {
      const targets = [String(parseInt(receiverId)), String(req.user.userId)]
      targets.forEach(uid => {
        onlineUsers.get(uid)?.forEach(sid => io.to(sid).emit('new-message', richMessage))
      })
    }

    res.status(201).json(message)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to send message' })
  }
}

// GET /messages/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.message.count({
      where: {
        receiverId: req.user.userId,
        read: false,
      }
    })
    res.json({ count })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get unread count' })
  }
}

// GET /messages/unread
export const getUnreadMessages = async (req, res) => {
  try {
    const userId = req.user.userId
    const messages = await prisma.message.findMany({
      where: { receiverId: userId, read: false },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        item:   { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    const result = messages.map(msg => ({
      id:           msg.id,
      senderId:     msg.sender.id,
      senderName:   `${msg.sender.firstName} ${msg.sender.lastName}`.trim(),
      senderAvatar: msg.sender.avatar || null,
      itemId:       msg.itemId,
      itemTitle:    msg.item?.title || 'Item',
      content:      msg.content,
      createdAt:    msg.createdAt,
    }))
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get unread messages' })
  }
}

// POST /messages/mark-all-read
export const markAllRead = async (req, res) => {
  try {
    await prisma.message.updateMany({
      where: { receiverId: req.user.userId, read: false },
      data: { read: true }
    })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to mark messages as read' })
  }
}

// DELETE /messages/conversation/:itemId/:otherUserId
// Deletes all messages between current user and otherUser about a specific item
export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user.userId
    const itemId = parseInt(req.params.itemId)
    const otherUserId = parseInt(req.params.otherUserId)

    if (!itemId || !otherUserId) {
      return res.status(400).json({ error: 'itemId and otherUserId are required' })
    }

    const { count } = await prisma.message.deleteMany({
      where: {
        itemId,
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ]
      }
    })

    res.json({ success: true, deleted: count })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete conversation' })
  }
}