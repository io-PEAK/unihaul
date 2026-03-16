import express from 'express'
import {
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
  getUnreadMessages,
  markAllRead,
  markConvoRead,
  deleteConversation,
} from '../controllers/messagesController.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// Specific static routes MUST come before /:itemId (wildcard)
router.get('/unread-count',    authMiddleware, getUnreadCount)
router.get('/unread',          authMiddleware, getUnreadMessages)
router.get('/conversations',   authMiddleware, getConversations)
router.post('/mark-all-read',  authMiddleware, markAllRead)
router.post('/mark-convo-read', authMiddleware, markConvoRead)

// Delete whole conversation (all messages between you and someone about an item)
router.delete('/conversation/:itemId/:otherUserId', authMiddleware, deleteConversation)

// Wildcard route last — otherwise /unread etc. would match /:itemId
router.get('/:itemId', authMiddleware, getMessages)
router.post('/',       authMiddleware, sendMessage)

export default router