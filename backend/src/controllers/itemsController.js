import prisma from '../lib/prisma.js'

const CATEGORY_SPEC_KEYS = {
  'Electronics':      ['brand', 'ram', 'storage', 'processor', 'display'],
  'Clothing':         ['gender', 'color', 'type'],
  'Books & Notes':    ['subject', 'author', 'edition'],
  'Furniture':        ['material', 'color', 'dimensions'],
  'Sports & Fitness': ['sport', 'brand', 'size'],
  'Stationery':       ['type', 'brand'],
  'Appliances':       ['brand', 'capacity', 'color'],
  'Games & Hobbies':  ['platform', 'type', 'brand'],
  'Services':         ['mode', 'experience'],
  'Food & Drinks':    ['type', 'ingredients', 'allergens'],
  'Other':            [],
}

function buildSpecFilters(category, query) {
  const keys = CATEGORY_SPEC_KEYS[category] || []
  return keys
    .filter(key => query[key] && query[key].trim() !== '')
    .map(key => ({
      specs: { path: [key], string_contains: query[key].trim() },
    }))
}

export const getItems = async (req, res) => {
  const { search, category, subcategory, sortPrice, ...rest } = req.query
  try {
    const specFilters = category ? buildSpecFilters(category, rest) : []
    const items = await prisma.item.findMany({
      where: {
        AND: [
          search      ? { title: { contains: search, mode: 'insensitive' } } : undefined,
          category    ? { category } : undefined,
          subcategory ? { subcategory } : undefined,
          ...specFilters,
        ].filter(Boolean),
      },
      include: { seller: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy:
        sortPrice === 'asc'  ? { price: 'asc' }  :
        sortPrice === 'desc' ? { price: 'desc' }  :
        { createdAt: 'desc' },
    })
    res.json(items)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch items.' })
  }
}

export const getMyItems = async (req, res) => {
  const userId = req.user.userId
  try {
    const items = await prisma.item.findMany({
      where: { sellerId: parseInt(userId) },
      include: { seller: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(items)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch your items.' })
  }
}

export const getItemById = async (req, res) => {
  const { id } = req.params
  try {
    const item = await prisma.item.findUnique({
      where: { id: parseInt(id) },
      include: { seller: { select: { id: true, firstName: true, lastName: true, email: true } } },
    })
    if (!item) return res.status(404).json({ error: 'Item not found.' })
    res.json(item)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch item.' })
  }
}

export const createItem = async (req, res) => {
  const { title, description, price, category, subcategory, imageUrl, condition, quantity, specs } = req.body
  const sellerId = req.user.userId

  const parsedPrice = parseFloat(price)
  if (isNaN(parsedPrice) || parsedPrice <= 0)
    return res.status(400).json({ error: 'Price must be greater than ₹0.' })
  const parsedQuantity = parseInt(quantity) || 1
  if (parsedQuantity < 1)
    return res.status(400).json({ error: 'Quantity must be at least 1.' })

  const cleanSpecs = specs && typeof specs === 'object'
    ? Object.fromEntries(Object.entries(specs).filter(([_, v]) => v && String(v).trim() !== ''))
    : null

  try {
    const item = await prisma.item.create({
      data: {
        title, description, price: parsedPrice, category,
        subcategory: subcategory || null, imageUrl, condition,
        quantity: parsedQuantity,
        specs: cleanSpecs && Object.keys(cleanSpecs).length > 0 ? cleanSpecs : undefined,
        sellerId: parseInt(sellerId),
      },
    })
    res.status(201).json(item)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create item.' })
  }
}

export const updateItem = async (req, res) => {
  const { id } = req.params
  const { title, description, price, category, subcategory, imageUrl, status, condition, quantity, specs } = req.body
  const userId = req.user.userId

  const parsedPrice = parseFloat(price)
  if (isNaN(parsedPrice) || parsedPrice <= 0)
    return res.status(400).json({ error: 'Price must be greater than ₹0.' })

  const cleanSpecs = specs && typeof specs === 'object'
    ? Object.fromEntries(Object.entries(specs).filter(([_, v]) => v && String(v).trim() !== ''))
    : null

  try {
    const item = await prisma.item.findUnique({ where: { id: parseInt(id) } })
    if (!item) return res.status(404).json({ error: 'Item not found.' })
    if (item.sellerId !== parseInt(userId)) return res.status(403).json({ error: 'Not your item.' })

    const updated = await prisma.item.update({
      where: { id: parseInt(id) },
      data: {
        title, description, price: parsedPrice, category,
        subcategory: subcategory || null, imageUrl, status, condition,
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(specs !== undefined && {
          specs: cleanSpecs && Object.keys(cleanSpecs).length > 0 ? cleanSpecs : undefined,
        }),
      },
    })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update item.' })
  }
}

// PATCH /items/:id/status — status-only update (used from messages, etc.)
export const updateItemStatus = async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const userId = req.user.userId

  const allowed = ['available', 'pending', 'sold']
  if (!status || !allowed.includes(status))
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` })

  try {
    const item = await prisma.item.findUnique({ where: { id: parseInt(id) } })
    if (!item) return res.status(404).json({ error: 'Item not found.' })
    if (item.sellerId !== parseInt(userId)) return res.status(403).json({ error: 'Not your item.' })

    const updated = await prisma.item.update({
      where: { id: parseInt(id) },
      data: { status },
    })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update status.' })
  }
}

export const deleteItem = async (req, res) => {
  const { id } = req.params
  const userId = req.user.userId
  try {
    const item = await prisma.item.findUnique({ where: { id: parseInt(id) } })
    if (!item) return res.status(404).json({ error: 'Item not found.' })
    if (item.sellerId !== parseInt(userId)) return res.status(403).json({ error: 'Not your item.' })

    await prisma.message.deleteMany({ where: { itemId: parseInt(id) } })
    await prisma.notification.deleteMany({ where: { itemId: parseInt(id) } })
    await prisma.cartItem.deleteMany({ where: { itemId: parseInt(id) } })
    await prisma.item.delete({ where: { id: parseInt(id) } })

    res.json({ message: 'Item deleted successfully.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete item.' })
  }
}