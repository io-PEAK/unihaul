import express from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  updateItemStatus,
  deleteItem,
  getMyItems,
} from '../controllers/itemsController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', getItems);
router.get('/mine', authMiddleware, getMyItems);
router.get('/:id', getItemById);
router.post('/', authMiddleware, createItem);
router.put('/:id', authMiddleware, updateItem);
router.patch('/:id/status', authMiddleware, updateItemStatus);
router.delete('/:id', authMiddleware, deleteItem);

export default router;