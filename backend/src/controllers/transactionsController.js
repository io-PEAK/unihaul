import prisma from '../lib/prisma.js'

// POST /transactions — buyer purchases a single item
export const createTransaction = async (req, res) => {
  const buyerId = req.user.userId
  const { itemId } = req.body
  try {
    const buyer = await prisma.user.findUnique({ where: { id: parseInt(buyerId) }, select: { name: true } })
    const item = await prisma.item.findUnique({ where: { id: parseInt(itemId) } })
    if (!item) return res.status(404).json({ error: 'Item not found.' })
    if (item.status !== 'available') return res.status(400).json({ error: 'Item is not available.' })
    if (item.sellerId === parseInt(buyerId)) return res.status(400).json({ error: 'You cannot buy your own item.' })

    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          itemId: parseInt(itemId),
          buyerId: parseInt(buyerId),
          sellerId: item.sellerId,
          status: 'completed',
        },
      }),
      prisma.item.update({
        where: { id: parseInt(itemId) },
        data: { status: 'sold' },
      }),
      // ✅ Create notification for the seller
      prisma.notification.create({
        data: {
          userId: item.sellerId,
          itemId: parseInt(itemId),
          buyerName: buyer.name,
          price: item.price,
          seen: false,
        },
      }),
    ])

    res.status(201).json(transaction)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create transaction.' })
  }
}

// GET /transactions — get all transactions for logged in user
export const getMyTransactions = async (req, res) => {
  const userId = parseInt(req.user.userId)
  try {
    const transactions = await prisma.transaction.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: {
        item: { select: { id: true, title: true, price: true, category: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = transactions.map(t => ({
      id: t.id,
      status: t.status,
      createdAt: t.createdAt,
      item_id: t.item.id,
      item_title: t.item.title,
      price: t.item.price,
      category: t.item.category,
      buyer_id: t.buyerId,
      seller_id: t.sellerId,
      buyer_name: t.buyer.name,
      seller_name: t.seller.name,
    }))

    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch transactions.' })
  }
}