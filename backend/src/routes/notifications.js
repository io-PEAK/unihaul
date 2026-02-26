import express from 'express'
import { getNotifications, markNotificationsSeen } from '../controllers/notificationsController.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

router.get('/', authMiddleware, getNotifications)
router.post('/mark-seen', authMiddleware, markNotificationsSeen)

export default router