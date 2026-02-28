import express from 'express'
import {
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
  getUnreadMessages,
  markAllRead,
} from '../controllers/messagesController.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// ⚠️ Specific static routes MUST come before /:itemId (wildcard)
router.get('/unread-count',  authMiddleware, getUnreadCount)
router.get('/unread',        authMiddleware, getUnreadMessages)   // ← NEW
router.get('/conversations', authMiddleware, getConversations)
router.post('/mark-all-read', authMiddleware, markAllRead)

// Wildcard route last — otherwise /unread matches /:itemId
router.get('/:itemId', authMiddleware, getMessages)
router.post('/',       authMiddleware, sendMessage)

export default router