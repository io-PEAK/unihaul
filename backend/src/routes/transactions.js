import express from 'express';
import { createTransaction, getMyTransactions } from '../controllers/transactionsController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, createTransaction);
router.get('/', authMiddleware, getMyTransactions);

export default router;