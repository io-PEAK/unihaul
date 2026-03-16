import prisma from '../lib/prisma.js'
import dotenv from 'dotenv'
dotenv.config()

// POST /reviews — leave a review after transaction
export async function createReview(req, res) {
  try {
    const reviewerId = req.user.id
    const { transactionId, rating, comment } = req.body

    if (!transactionId || !rating) return res.status(400).json({ error: 'transactionId and rating are required' })
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' })

    const transaction = await prisma.transaction.findUnique({ where: { id: parseInt(transactionId) } })
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' })
    if (transaction.status !== 'completed') return res.status(400).json({ error: 'Can only review completed transactions' })
    if (transaction.buyerId !== reviewerId && transaction.sellerId !== reviewerId) {
      return res.status(403).json({ error: 'Not part of this transaction' })
    }

    // Reviewer reviews the other party
    const revieweeId = transaction.buyerId === reviewerId ? transaction.sellerId : transaction.buyerId

    const existing = await prisma.review.findUnique({ where: { transactionId: parseInt(transactionId) } })
    if (existing) return res.status(400).json({ error: 'Review already submitted for this transaction' })

    const review = await prisma.review.create({
      data: { reviewerId, revieweeId, transactionId: parseInt(transactionId), rating, comment: comment || null },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true, avatar: true } }
      }
    })

    res.status(201).json(review)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create review' })
  }
}

// GET /reviews/:userId — get all reviews for a user
export async function getUserReviews(req, res) {
  try {
    const { userId } = req.params

    const reviews = await prisma.review.findMany({
      where: { revieweeId: parseInt(userId) },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const avg = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

    res.json({ reviews, averageRating: avg ? parseFloat(avg.toFixed(1)) : null, total: reviews.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get reviews' })
  }
}
