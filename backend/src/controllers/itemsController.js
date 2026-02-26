import prisma from '../lib/prisma.js'

// GET all items
export const getItems = async (req, res) => {
  const { search, category, subcategory } = req.query
  try {
    const items = await prisma.item.findMany({
      where: {
        ...(search && { title: { contains: search, mode: 'insensitive' } }),
        ...(category && { category }),
        ...(subcategory && { subcategory }),
      },
      include: { seller: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(items)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch items.' })
  }
}

// GET my items (protected)
export const getMyItems = async (req, res) => {
  const userId = req.user.userId
  try {
    const items = await prisma.item.findMany({
      where: { sellerId: parseInt(userId) },
      include: { seller: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(items)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch your items.' })
  }
}

// GET single item
export const getItemById = async (req, res) => {
  const { id } = req.params
  try {
    const item = await prisma.item.findUnique({
      where: { id: parseInt(id) },
      include: { seller: { select: { id: true, name: true, email: true } } },
    })
    if (!item) return res.status(404).json({ error: 'Item not found.' })
    res.json(item)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch item.' })
  }
}

// POST create item (protected)
export const createItem = async (req, res) => {
  const { title, description, price, category, subcategory, imageUrl, condition, quantity } = req.body
  const sellerId = req.user.userId

  const parsedPrice = parseFloat(price)
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: 'Price must be greater than ₹0.' })
  }

  const parsedQuantity = parseInt(quantity) || 1
  if (parsedQuantity < 1) {
    return res.status(400).json({ error: 'Quantity must be at least 1.' })
  }

  try {
    const item = await prisma.item.create({
      data: {
        title,
        description,
        price: parsedPrice,
        category,
        subcategory: subcategory || null,
        imageUrl,
        condition,
        quantity: parsedQuantity,
        sellerId: parseInt(sellerId),
      },
    })
    res.status(201).json(item)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create item.' })
  }
}

// PUT update item (protected)
export const updateItem = async (req, res) => {
  const { id } = req.params
  const { title, description, price, category, subcategory, imageUrl, status, condition, quantity } = req.body
  const userId = req.user.userId

  const parsedPrice = parseFloat(price)
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: 'Price must be greater than ₹0.' })
  }

  try {
    const item = await prisma.item.findUnique({ where: { id: parseInt(id) } })
    if (!item) return res.status(404).json({ error: 'Item not found.' })
    if (item.sellerId !== parseInt(userId)) return res.status(403).json({ error: 'Not your item.' })

    const updated = await prisma.item.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        price: parsedPrice,
        category,
        subcategory: subcategory || null,
        imageUrl,
        status,
        condition,
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
      },
    })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update item.' })
  }
}

// DELETE item (protected)
export const deleteItem = async (req, res) => {
  const { id } = req.params
  const userId = req.user.userId
  try {
    const item = await prisma.item.findUnique({ where: { id: parseInt(id) } })
    if (!item) return res.status(404).json({ error: 'Item not found.' })
    if (item.sellerId !== parseInt(userId)) return res.status(403).json({ error: 'Not your item.' })
    await prisma.message.deleteMany({ where: { itemId: parseInt(id) } })
    await prisma.transaction.deleteMany({ where: { itemId: parseInt(id) } })
    await prisma.notification.deleteMany({ where: { itemId: parseInt(id) } })
    await prisma.cartItem.deleteMany({ where: { itemId: parseInt(id) } })
    await prisma.item.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Item deleted successfully.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete item.' })
  }
}