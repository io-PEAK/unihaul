import prisma from '../lib/prisma.js'
import dotenv from 'dotenv'
dotenv.config()

// POST /chat-requests — send a request
export async function sendChatRequest(req, res) {
  try {
    const senderId = req.user.id
    const { receiverId, message } = req.body

    if (!receiverId) return res.status(400).json({ error: 'receiverId is required' })
    if (senderId === receiverId) return res.status(400).json({ error: 'Cannot send request to yourself' })

    // Check if request already exists
    const existing = await prisma.chatRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } }
    })
    if (existing) return res.status(400).json({ error: 'Request already sent', status: existing.status })

    const request = await prisma.chatRequest.create({
      data: { senderId, receiverId, message: message || null },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true, institution: true } }
      }
    })

    res.status(201).json(request)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to send chat request' })
  }
}

// GET /chat-requests — get all requests for current user
export async function getChatRequests(req, res) {
  try {
    const userId = req.user.id

    const received = await prisma.chatRequest.findMany({
      where: { receiverId: userId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true, institution: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const sent = await prisma.chatRequest.findMany({
      where: { senderId: userId },
      include: {
        receiver: { select: { id: true, firstName: true, lastName: true, avatar: true, institution: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ received, sent })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get chat requests' })
  }
}

// PATCH /chat-requests/:id — accept or decline
export async function respondToChatRequest(req, res) {
  try {
    const userId = req.user.id
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
      data: { status },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } }
      }
    })

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to respond to chat request' })
  }
}
