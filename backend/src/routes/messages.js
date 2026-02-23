import express from 'express';
import {
  sendMessage,
  getMessagesByItem,
  getMyConversations,
} from '../controllers/messagesController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, sendMessage);
router.get('/conversations', authMiddleware, getMyConversations);
router.get('/:itemId', authMiddleware, getMessagesByItem);

export default router;