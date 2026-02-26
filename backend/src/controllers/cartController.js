import prisma from '../lib/prisma.js'

// GET /cart — get my cart
export const getCart = async (req, res) => {
  const userId = parseInt(req.user.userId)
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        item: {
          include: { seller: { select: { id: true, name: true, email: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(cartItems)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch cart.' })
  }
}

// POST /cart — add item to cart
export const addToCart = async (req, res) => {
  const userId = parseInt(req.user.userId)
  const { itemId, quantity = 1 } = req.body
  try {
    const item = await prisma.item.findUnique({ where: { id: parseInt(itemId) } })
    if (!item) return res.status(404).json({ error: 'Item not found.' })
    if (item.status !== 'available') return res.status(400).json({ error: 'Item is not available.' })
    if (item.sellerId === userId) return res.status(400).json({ error: 'You cannot add your own item to cart.' })

    const requestedQty = parseInt(quantity)
    if (requestedQty < 1 || requestedQty > item.quantity) {
      return res.status(400).json({ error: `Quantity must be between 1 and ${item.quantity}.` })
    }

    // If already in cart, update quantity
    const existing = await prisma.cartItem.findUnique({
      where: { userId_itemId: { userId, itemId: parseInt(itemId) } }
    })

    if (existing) {
      const newQty = Math.min(existing.quantity + requestedQty, item.quantity)
      const updated = await prisma.cartItem.update({
        where: { userId_itemId: { userId, itemId: parseInt(itemId) } },
        data: { quantity: newQty },
        include: { item: true },
      })
      return res.json(updated)
    }

    const cartItem = await prisma.cartItem.create({
      data: { userId, itemId: parseInt(itemId), quantity: requestedQty },
      include: { item: true },
    })
    res.status(201).json(cartItem)
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Item already in cart.' })
    console.error(err)
    res.status(500).json({ error: 'Failed to add to cart.' })
  }
}

// PATCH /cart/:itemId — update quantity in cart
export const updateCartQuantity = async (req, res) => {
  const userId = parseInt(req.user.userId)
  const itemId = parseInt(req.params.itemId)
  const { quantity } = req.body

  try {
    const item = await prisma.item.findUnique({ where: { id: itemId } })
    if (!item) return res.status(404).json({ error: 'Item not found.' })

    const qty = parseInt(quantity)
    if (qty < 1 || qty > item.quantity) {
      return res.status(400).json({ error: `Quantity must be between 1 and ${item.quantity}.` })
    }

    const updated = await prisma.cartItem.update({
      where: { userId_itemId: { userId, itemId } },
      data: { quantity: qty },
      include: { item: { include: { seller: { select: { id: true, name: true, email: true } } } } },
    })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update quantity.' })
  }
}

// DELETE /cart/:itemId — remove from cart
export const removeFromCart = async (req, res) => {
  const userId = parseInt(req.user.userId)
  const itemId = parseInt(req.params.itemId)
  try {
    await prisma.cartItem.deleteMany({ where: { userId, itemId } })
    res.json({ message: 'Removed from cart.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to remove from cart.' })
  }
}

// POST /cart/checkout — buy everything in cart
export const checkout = async (req, res) => {
  const userId = parseInt(req.user.userId)
  try {
    const buyer = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { item: true },
    })
    if (cartItems.length === 0) return res.status(400).json({ error: 'Your cart is empty.' })

    const available = cartItems.filter(c => c.item.status === 'available')
    if (available.length === 0) return res.status(400).json({ error: 'No available items in cart.' })

    const ops = available.flatMap(c => [
      prisma.transaction.create({
        data: {
          itemId: c.itemId,
          buyerId: userId,
          sellerId: c.item.sellerId,
          status: 'completed',
        },
      }),
      prisma.item.update({
        where: { id: c.itemId },
        data: {
          // Reduce quantity; mark sold if hits 0
          quantity: Math.max(0, c.item.quantity - c.quantity),
          ...(c.item.quantity - c.quantity <= 0 && { status: 'sold' }),
        },
      }),
      prisma.notification.create({
        data: {
          userId: c.item.sellerId,
          itemId: c.itemId,
          buyerName: buyer.name,
          price: c.item.price * c.quantity,
          seen: false,
        },
      }),
    ])

    ops.push(prisma.cartItem.deleteMany({ where: { userId } }))
    await prisma.$transaction(ops)

    res.json({
      message: `Successfully purchased ${available.length} item(s).`,
      purchased: available.length,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Checkout failed.' })
  }
}