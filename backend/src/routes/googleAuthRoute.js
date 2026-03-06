import express from 'express'
import { googleAuth, linkGoogle, unlinkGoogle } from '../controllers/googleAuthController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/google', googleAuth)
router.post('/google/link', protect, linkGoogle)
router.delete('/google/unlink', protect, unlinkGoogle)

export default router