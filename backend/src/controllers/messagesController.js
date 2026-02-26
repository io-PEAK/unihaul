import prisma from '../lib/prisma.js'

// GET /messages/conversations
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId  // ✅ fixed from req.user.id

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
        item: { select: { id: true, title: true } },
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
          other_user_id: otherUser.id,
          other_user_name: otherUser.name,
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
    const userId = req.user.userId  // ✅ fixed
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
        senderId: req.user.userId,  // ✅ fixed
        receiverId: parseInt(receiverId),
        itemId: parseInt(itemId),
        content: content.trim(),
        read: false,
      }
    })

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
        receiverId: req.user.userId,  // ✅ fixed
        read: false,
      }
    })
    res.json({ count })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get unread count' })
  }
}

// POST /messages/mark-all-read
export const markAllRead = async (req, res) => {
  try {
    await prisma.message.updateMany({
      where: {
        receiverId: req.user.userId,  // ✅ fixed
        read: false,
      },
      data: { read: true }
    })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to mark messages as read' })
  }
}