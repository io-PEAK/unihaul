import express from 'express'
import {
  getNotifications,
  getAllNotifications,
  markNotificationsSeen,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notificationsController.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

router.get('/',           authMiddleware, getNotifications)       // unseen count
router.get('/all',        authMiddleware, getAllNotifications)     // full dropdown list
router.post('/mark-seen', authMiddleware, markNotificationsSeen)  // mark all seen
router.delete('/clear',   authMiddleware, clearAllNotifications)  // clear all
router.delete('/:id',     authMiddleware, deleteNotification)     // delete one

export default router