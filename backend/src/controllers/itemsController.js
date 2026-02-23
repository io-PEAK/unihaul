import prisma from '../lib/prisma.js';

// GET all items (with optional search and category filter)
export const getItems = async (req, res) => {
  const { search, category } = req.query;

  try {
    const items = await prisma.item.findMany({
      where: {
        ...(search && {
          title: { contains: search, mode: 'insensitive' },
        }),
        ...(category && { category }),
      },
      include: { seller: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items.' });
  }
};

// GET single item
export const getItemById = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: { seller: { select: { id: true, name: true, email: true } } },
    });

    if (!item) return res.status(404).json({ error: 'Item not found.' });

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch item.' });
  }
};

// POST create item (protected)
export const createItem = async (req, res) => {
const { title, description, price, category, imageUrl, condition } = req.body;
  const sellerId = req.user.userId;

  try {
    const item = await prisma.item.create({
data: { title, description, price: parseFloat(price), category, imageUrl, condition, sellerId },
    });

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create item.' });
  }
};

// PUT update item (protected)
export const updateItem = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, category, imageUrl, status } = req.body;
  const userId = req.user.userId;

  try {
    const item = await prisma.item.findUnique({ where: { id } });

    if (!item) return res.status(404).json({ error: 'Item not found.' });
    if (item.sellerId !== userId) return res.status(403).json({ error: 'Not your item.' });

    const updated = await prisma.item.update({
      where: { id },
      data: { title, description, price: parseFloat(price), category, imageUrl, status },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item.' });
  }
};

// DELETE item (protected)
export const deleteItem = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const item = await prisma.item.findUnique({ where: { id } });

    if (!item) return res.status(404).json({ error: 'Item not found.' });
    if (item.sellerId !== userId) return res.status(403).json({ error: 'Not your item.' });

    await prisma.item.delete({ where: { id } });

    res.json({ message: 'Item deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
};