import prisma from '../lib/prisma.js'

// POST /transactions — buyer purchases a single item directly (not via cart)
export const createTransaction = async (req, res) => {
  const buyerId = req.user.userId
  const { itemId } = req.body
  try {
    const buyer = await prisma.user.findUnique({ where: { id: parseInt(buyerId) }, select: { firstName: true, lastName: true } })
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
          quantity: 1,
          price: item.price,
          itemTitle: item.title,
          itemCategory: item.category,
        },
      }),
      prisma.item.update({
        where: { id: parseInt(itemId) },
        data: { status: 'sold' },
      }),
      prisma.notification.create({
        data: {
          userId: item.sellerId,
          itemId: parseInt(itemId),
          itemTitle: item.title,
          buyerName: `${buyer.firstName} ${buyer.lastName}`.trim(),
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
        buyer:  { select: { id: true, firstName: true, lastName: true, email: true } },
        seller: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = transactions.map(t => ({
      id:           t.id,
      status:       t.status,
      created_at:   t.createdAt,
      item_id:      t.itemId,
      item_title:   t.itemTitle,
      price:        t.price,
      quantity:     t.quantity,
      category:     t.itemCategory,
      buyer_id:     t.buyerId,
      seller_id:    t.sellerId,
      buyer_name: `${t.buyer.firstName} ${t.buyer.lastName}`.trim(),
      seller_name: `${t.seller.firstName} ${t.seller.lastName}`.trim(),
    }))

    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch transactions.' })
  }
}

// DELETE /transactions/:id — delete a transaction (only buyer or seller can delete their own)
export const deleteTransaction = async (req, res) => {
  const userId = parseInt(req.user.userId)
  const txnId  = parseInt(req.params.id)
  try {
    const txn = await prisma.transaction.findUnique({ where: { id: txnId } })
    if (!txn) return res.status(404).json({ error: 'Transaction not found.' })

    if (txn.buyerId !== userId && txn.sellerId !== userId) {
      return res.status(403).json({ error: 'Not authorised to delete this transaction.' })
    }

    await prisma.transaction.delete({ where: { id: txnId } })
    res.json({ message: 'Transaction deleted.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete transaction.' })
  }
}