import express from 'express'
import { getMe, updateProfile, completeProfile } from '../controllers/usersController.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

router.get('/me',               authMiddleware, getMe)
router.put('/profile',          authMiddleware, updateProfile)
router.put('/complete-profile', authMiddleware, completeProfile)

export default router