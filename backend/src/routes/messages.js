import express from 'express'
import { getConversations, getMessages, sendMessage, getUnreadCount, markAllRead } from '../controllers/messagesController.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

router.get('/unread-count', authMiddleware, getUnreadCount)
router.get('/conversations', authMiddleware, getConversations)
router.post('/mark-all-read', authMiddleware, markAllRead)
router.get('/:itemId', authMiddleware, getMessages)
router.post('/', authMiddleware, sendMessage)

export default router