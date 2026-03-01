import express from 'express'
import { getMe, updateProfile, completeProfile, deleteAccount } from '../controllers/usersController.js'
import { sendOtp, changeEmail, changePassword, resetPasswordWithOtp } from '../controllers/otpController.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// Profile
router.get('/me',               authMiddleware, getMe)
router.put('/profile',          authMiddleware, updateProfile)
router.put('/complete-profile', authMiddleware, completeProfile)
router.delete('/account',       authMiddleware, deleteAccount)

// OTP / email / password
router.post('/send-otp',        authMiddleware, sendOtp)
router.post('/change-email',    authMiddleware, changeEmail)
router.post('/change-password', authMiddleware, changePassword)
router.post('/reset-password',  authMiddleware, resetPasswordWithOtp)

export default router