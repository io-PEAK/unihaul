import express from 'express'
import authMiddleware from '../middleware/auth.js'
import { sendChatRequest, getChatRequests, respondToChatRequest } from '../controllers/chatRequestsController.js'

const router = express.Router()

router.post('/',     authMiddleware, sendChatRequest)
router.get('/',      authMiddleware, getChatRequests)
router.patch('/:id', authMiddleware, respondToChatRequest)

export default router