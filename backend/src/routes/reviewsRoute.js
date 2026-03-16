import express from 'express'
import authMiddleware from '../middleware/auth.js'
import { createReview, getUserReviews } from '../controllers/reviewsController.js'

const router = express.Router()

router.post('/',       authMiddleware, createReview)
router.get('/:userId', getUserReviews)

export default router