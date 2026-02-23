import prisma from '../lib/prisma.js';

// POST send a message (protected)
export const sendMessage = async (req, res) => {
  const { receiverId, itemId, content } = req.body;
  const senderId = req.user.userId;

  try {
    const message = await prisma.message.create({
      data: { senderId, receiverId, itemId, content },
    });

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
};

// GET messages for an item (protected)
export const getMessagesByItem = async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.userId;

  try {
    const messages = await prisma.message.findMany({
      where: {
        itemId,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
};

// GET all conversations for logged in user (protected)
export const getMyConversations = async (req, res) => {
  const userId = req.user.userId;

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
        item: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
};