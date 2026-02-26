import express from 'express';
import { getCart, addToCart, removeFromCart, checkout, updateCartQuantity } from '../controllers/cartController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getCart);
router.post('/', authMiddleware, addToCart);
router.patch('/:itemId', authMiddleware, updateCartQuantity);
router.delete('/:itemId', authMiddleware, removeFromCart);
router.post('/checkout', authMiddleware, checkout);

export default router;