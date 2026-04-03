import prisma from '../lib/prisma.js'
import { io } from '../../server.js'
import dotenv from 'dotenv'
dotenv.config()

// POST /chat-requests
export async function sendChatRequest(req, res) {
  try {
    const senderId = req.user.userId
    const { receiverId, message, itemId } = req.body
    const parsedItemId = itemId && itemId !== 'null' ? parseInt(itemId) : null

    if (!receiverId) return res.status(400).json({ error: 'receiverId is required' })
    if (senderId === receiverId) return res.status(400).json({ error: 'Cannot send request to yourself' })

    // Check if ANY accepted request exists between these users ever
    const anyAcceptedRequest = await prisma.chatRequest.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    })

    const statusToSet = anyAcceptedRequest ? 'accepted' : 'pending'

    const existing = await prisma.chatRequest.findFirst({
      where: { senderId, receiverId, itemId: parsedItemId }
    })

    if (existing) {
      if (existing.status === 'declined') {
        if (existing.declinedAt) {
          const hoursSince = (Date.now() - new Date(existing.declinedAt).getTime()) / (1000 * 60 * 60)
          if (hoursSince < 24) {
            const hoursLeft = Math.ceil(24 - hoursSince)
            return res.status(429).json({
              error: `Request was declined. You can try again in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}.`,
              hoursLeft, cooldown: true
            })
          }
        }
        await prisma.chatRequest.delete({ where: { id: existing.id } })
      } else if (existing.status === 'accepted') {
        if (existing.deletedBySender || existing.deletedByReceiver) {
          await prisma.chatRequest.delete({ where: { id: existing.id } })
        } else {
          return res.status(400).json({ error: 'Already chatting', status: 'accepted' })
        }
      } else if (existing.status === 'pending') {
        if (existing.deletedBySender) {
          await prisma.chatRequest.delete({ where: { id: existing.id } })
        } else if (!anyAcceptedRequest) {
          return res.status(400).json({ error: 'Request already sent', status: existing.status })
        } else {
          await prisma.chatRequest.delete({ where: { id: existing.id } })
        }
      }
    }

    const request = await prisma.chatRequest.create({
      data: { 
        senderId, 
        receiverId, 
        itemId: parsedItemId, 
        // FIX: Leave message null if auto-accepted so UI doesn't read duplicates
        message: statusToSet === 'pending' ? (message || null) : null, 
        status: statusToSet 
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true, institution: true } },
        item:   { select: { id: true, title: true, images: true } }
      }
    })

    if (statusToSet === 'accepted' && message) {
      await prisma.message.create({
        data: {
          senderId,
          receiverId,
          itemId: parsedItemId,
          content: message,
          read: false,
        }
      })
    }

    const onlineUsers = io?._onlineUsers
    if (onlineUsers) {
      onlineUsers.get(String(receiverId))?.forEach(sid => {
        if (statusToSet === 'pending') {
          io.to(sid).emit('new-chat-request', {
            id:        request.id,
            sender:    request.sender,
            message:   request.message,
            itemId:    parsedItemId,
            item:      request.item,
            createdAt: request.createdAt,
          })
        } else {
          // If auto-accepted, ping their UI to refresh conversations list
          io.to(sid).emit('request-accepted', {
            requestId: request.id,
            itemId:    parsedItemId,
            seller:    request.sender, // For the receiver, the 'seller/other' is the sender
            message:   request.message,
            createdAt: request.createdAt,
          })
          
          if (message) {
            io.to(sid).emit('new-message', {
              id:         'auto-msg-' + request.id,
              senderId:   senderId,
              receiverId: receiverId,
              itemId:     parsedItemId,
              content:    message,
              read:       false,
              createdAt:  request.createdAt,
              senderName: `${request.sender.firstName} ${request.sender.lastName}`.trim(),
              senderAvatar: request.sender.avatar,
              itemTitle:  request.item?.title || ''
            })
          }
        }
      })
    }

    res.status(201).json(request)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to send chat request' })
  }
}

// GET /chat-requests
export async function getChatRequests(req, res) {
  try {
    const userId = req.user.userId

    const [received, sent] = await Promise.all([
      prisma.chatRequest.findMany({
        where: { receiverId: userId },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatar: true, institution: true } },
          item:   { select: { id: true, title: true, images: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.chatRequest.findMany({
        where: { senderId: userId },
        include: {
          receiver: { select: { id: true, firstName: true, lastName: true, avatar: true, institution: true } },
          item:     { select: { id: true, title: true, images: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    res.json({ received, sent })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get chat requests' })
  }
}

// PATCH /chat-requests/:id
export async function respondToChatRequest(req, res) {
  try {
    const userId = req.user.userId
    const { id } = req.params
    const { status } = req.body

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or declined' })
    }

    const request = await prisma.chatRequest.findUnique({ where: { id: parseInt(id) } })
    if (!request) return res.status(404).json({ error: 'Request not found' })
    if (request.receiverId !== userId) return res.status(403).json({ error: 'Not authorized' })
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request already responded to' })

    const updated = await prisma.chatRequest.update({
      where: { id: parseInt(id) },
      data: {
        status,
        ...(status === 'declined' && { declinedAt: new Date() }),
      },
      include: {
        sender:   { select: { id: true, firstName: true, lastName: true, avatar: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        item:     { select: { id: true, title: true, images: true } }
      }
    })

    const onlineUsers = io?._onlineUsers

    if (status === 'accepted') {
      
      if (request.message) {
        const existingMsg = await prisma.message.findFirst({
          where: {
            senderId: request.senderId,
            receiverId: request.receiverId,
            itemId: request.itemId,
            createdAt: request.createdAt
          }
        })
        if (!existingMsg) {
          await prisma.message.create({
            data: {
              senderId: request.senderId,
              receiverId: request.receiverId,
              itemId: request.itemId,
              content: request.message,
              read: true,
              createdAt: request.createdAt
            }
          })
        }
      }

      onlineUsers?.get(String(request.senderId))?.forEach(sid => {
        io.to(sid).emit('request-accepted', {
          requestId: parseInt(id),
          itemId:    request.itemId,
          seller:    updated.receiver,
          message:   request.message,
          createdAt: request.createdAt,
        })
      })
    }

    if (status === 'declined') {
      onlineUsers?.get(String(request.senderId))?.forEach(sid => {
        io.to(sid).emit('request-declined', {
          requestId: parseInt(id),
          itemId:    request.itemId,
        })
      })
    }

    res.json(updated)
  } catch (err) {
    console.error('respondToChatRequest error:', err)
    res.status(500).json({ error: 'Failed to respond to chat request' })
  }
}