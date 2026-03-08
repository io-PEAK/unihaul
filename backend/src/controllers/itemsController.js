import prisma from '../lib/prisma.js'
import { v2 as cloudinary } from 'cloudinary'
import { io } from '../../server.js'

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

const toTitleCase = s => s
  ? s.trim().replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  : null

function buildSpecFilters(category, query) {
  const keys = CATEGORY_SPEC_KEYS[category] || []
  return keys
    .filter(key => query[key] && query[key].trim() !== '')
    .map(key => ({
      specs: { path: [key], string_contains: query[key].trim() },
    }))
}

const sellerSelect = { id: true, firstName: true, lastName: true, email: true, avatar: true }

export const getItems = async (req, res) => {
  const { search, category, subcategory, sortPrice, institutions, cities, states, ...rest } = req.query
  try {
    const specFilters = category ? buildSpecFilters(category, rest) : []
    const locationFilters = []

    if (institutions) {
      const list = institutions.split(',').map(s => s.trim()).filter(Boolean)
      if (list.length > 0) locationFilters.push({ sellerInstitution: { in: list, mode: 'insensitive' } })
    }

    if (cities) {
      try {
        const cityMap = JSON.parse(cities)
        const cityConditions = Object.entries(cityMap).map(([state, cityList]) => ({
          AND: [
            { sellerState: { equals: toTitleCase(state) } },
            { sellerCity: { in: cityList.map(toTitleCase) } },
          ]
        }))
        if (cityConditions.length > 0) locationFilters.push(...cityConditions)
      } catch {}
    }

    if (states) {
      const list = states.split(',').map(s => toTitleCase(s)).filter(Boolean)
      if (list.length > 0) locationFilters.push({ sellerState: { in: list } })
    }

    const items = await prisma.item.findMany({
      where: {
        AND: [
          search      ? { title: { contains: search, mode: 'insensitive' } } : undefined,
          category    ? { category } : undefined,
          subcategory ? { subcategory } : undefined,
          ...specFilters,
          locationFilters.length > 0 ? { OR: locationFilters } : undefined,
        ].filter(Boolean),
      },
      include: { seller: { select: sellerSelect } },
      orderBy: { createdAt: 'desc' }, // base order — ranking/price sort applied in JS below
    })

    // ── Smart search ranking — always applied when search term present ──
    // Within each relevance tier, respect price sort if active
    if (search) {
      const q = search.trim().toLowerCase()
      const score = title => {
        const t = title.toLowerCase()
        if (t.startsWith(q))                         return 0  // title starts with query
        if (t.split(' ').some(w => w.startsWith(q))) return 1  // a word starts with query
        return 2                                                // contains anywhere
      }
      const ranked = items.slice().sort((a, b) => {
        const diff = score(a.title) - score(b.title)
        if (diff !== 0) return diff
        // Same relevance tier — apply price sort if requested, else keep date order
        if (sortPrice === 'asc')  return a.price - b.price
        if (sortPrice === 'desc') return b.price - a.price
        return 0
      })
      return res.json(ranked)
    }

    // No search — pure price or date sort (already ordered by createdAt, re-sort for price)
    if (sortPrice === 'asc')  return res.json(items.slice().sort((a, b) => a.price - b.price))
    if (sortPrice === 'desc') return res.json(items.slice().sort((a, b) => b.price - a.price))

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
      include: { seller: { select: sellerSelect } },
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
      include: { seller: { select: sellerSelect } },
    })
    if (!item) return res.status(404).json({ error: 'Item not found.' })
    res.json(item)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch item.' })
  }
}

export const createItem = async (req, res) => {
  const { title, description, price, category, subcategory, imageUrl, images, condition, quantity, specs } = req.body
  const sellerId = req.user.userId

  const parsedPrice = parseFloat(price)
  if (isNaN(parsedPrice) || parsedPrice <= 0)
    return res.status(400).json({ error: 'Price must be greater than ₹0.' })
  const parsedQuantity = parseInt(quantity) || 1
  if (parsedQuantity < 1)
    return res.status(400).json({ error: 'Quantity must be at least 1.' })

  let imageList = []
  if (Array.isArray(images) && images.length > 0) imageList = images.filter(Boolean)
  else if (typeof images === 'string' && images) imageList = [images]
  else if (imageUrl) imageList = [imageUrl]

  const cleanSpecs = specs && typeof specs === 'object'
    ? Object.fromEntries(Object.entries(specs).filter(([_, v]) => v && String(v).trim() !== ''))
    : null

  try {
    const seller = await prisma.user.findUnique({
      where: { id: parseInt(sellerId) },
      select: { institution: true, institutionType: true, city: true, state: true }
    })

    const item = await prisma.item.create({
      data: {
        title, description,
        price: parsedPrice,
        category,
        subcategory: subcategory || null,
        imageUrl: imageList[0] || null,
        images: imageList,
        condition,
        quantity: parsedQuantity,
        specs: cleanSpecs && Object.keys(cleanSpecs).length > 0 ? cleanSpecs : undefined,
        sellerId: parseInt(sellerId),
        sellerInstitution:     seller?.institution       || null,
        sellerInstitutionType: seller?.institutionType   || null,
        sellerCity:            toTitleCase(seller?.city) || null,
        sellerState:           toTitleCase(seller?.state)|| null,
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
  const { title, description, price, category, subcategory, imageUrl, images, status, condition, quantity, specs } = req.body
  const userId = req.user.userId

  const parsedPrice = parseFloat(price)
  if (isNaN(parsedPrice) || parsedPrice <= 0)
    return res.status(400).json({ error: 'Price must be greater than ₹0.' })

  const cleanSpecs = specs && typeof specs === 'object'
    ? Object.fromEntries(Object.entries(specs).filter(([_, v]) => v && String(v).trim() !== ''))
    : null

  let imageList = null
  if (Array.isArray(images) && images.length > 0) imageList = images.filter(Boolean)
  else if (typeof images === 'string' && images) imageList = [images]
  else if (imageUrl) imageList = [imageUrl]

  try {
    const item = await prisma.item.findUnique({ where: { id: parseInt(id) } })
    if (!item) return res.status(404).json({ error: 'Item not found.' })
    if (item.sellerId !== parseInt(userId)) return res.status(403).json({ error: 'Not your item.' })

    const updated = await prisma.item.update({
      where: { id: parseInt(id) },
      data: {
        title, description, price: parsedPrice, category,
        subcategory: subcategory || null,
        status, condition,
        ...(imageList && { imageUrl: imageList[0] || null, images: imageList }),
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(specs !== undefined && {
          specs: cleanSpecs && Object.keys(cleanSpecs).length > 0 ? cleanSpecs : undefined,
        }),
      },
    })

    // ── Price drop detection ───────────────────────────────────
    console.log("PRICE CHECK:", parsedPrice, "<", item.price, "=", parsedPrice < item.price)
    if (parsedPrice < item.price) {
      // Find all watchers who have priceDropAlerts enabled
      const watchers = await prisma.watchedItem.findMany({
        where: { itemId: parseInt(id) },
        include: { user: { select: { id: true, priceDropAlerts: true, notificationsEnabled: true } } }
      })

      for (const watcher of watchers) {
        if (!watcher.user.priceDropAlerts || !watcher.user.notificationsEnabled) continue

        // Create in-app notification
        const notification = await prisma.notification.create({
          data: {
            type: 'price_drop',
            userId: watcher.userId,
            itemId: parseInt(id),
            itemTitle: updated.title,
            oldPrice: item.price,
            price: parsedPrice,
            message: `Price dropped from ₹${item.price} to ₹${parsedPrice} on "${updated.title}"`,
            seen: false,
          }
        })

        // Real-time socket notification
        const userSockets = io._onlineUsers?.get(String(watcher.userId))
        if (userSockets) {
          userSockets.forEach(sid => {
            io.to(sid).emit('price-drop', {
              notification,
              itemId: parseInt(id),
              oldPrice: item.price,
              newPrice: parsedPrice,
              itemTitle: updated.title,
            })
          })
        }

        // Update priceAtWatch to new price so next drop is relative to this
        await prisma.watchedItem.update({
          where: { id: watcher.id },
          data: { priceAtWatch: parsedPrice }
        })
      }
    }

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update item.' })
  }
}

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

    const allUrls = [
      ...(Array.isArray(item.images) ? item.images : []),
      ...(item.imageUrl && !item.images?.includes(item.imageUrl) ? [item.imageUrl] : []),
    ].filter(Boolean)

    if (allUrls.length > 0) {
      const publicIds = allUrls.map(url => {
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(\.[a-z]+)?$/)
        return match ? match[1] : null
      }).filter(Boolean)
      await Promise.allSettled(publicIds.map(publicId => cloudinary.uploader.destroy(publicId)))
    }

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

// ── Watch / Unwatch ───────────────────────────────────────────
export const watchItem = async (req, res) => {
  const { id } = req.params
  const userId = req.user.userId
  try {
    const item = await prisma.item.findUnique({ where: { id: parseInt(id) } })
    if (!item) return res.status(404).json({ error: 'Item not found.' })
    if (item.sellerId === parseInt(userId)) return res.status(400).json({ error: 'Cannot watch your own item.' })

    const watch = await prisma.watchedItem.upsert({
      where: { userId_itemId: { userId: parseInt(userId), itemId: parseInt(id) } },
      update: {},
      create: { userId: parseInt(userId), itemId: parseInt(id), priceAtWatch: item.price }
    })
    res.json({ watching: true, watch })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to watch item.' })
  }
}

export const unwatchItem = async (req, res) => {
  const { id } = req.params
  const userId = req.user.userId
  try {
    await prisma.watchedItem.deleteMany({
      where: { userId: parseInt(userId), itemId: parseInt(id) }
    })
    res.json({ watching: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to unwatch item.' })
  }
}

export const getWatchStatus = async (req, res) => {
  const { id } = req.params
  const userId = req.user.userId
  try {
    const watch = await prisma.watchedItem.findUnique({
      where: { userId_itemId: { userId: parseInt(userId), itemId: parseInt(id) } }
    })
    res.json({ watching: !!watch, watch: watch || null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get watch status.' })
  }
}

export const getWatchedItems = async (req, res) => {
  const userId = req.user.userId
  try {
    const watched = await prisma.watchedItem.findMany({
      where: { userId: parseInt(userId) },
      include: {
        item: {
          select: {
            id: true, title: true, price: true, status: true,
            images: true, category: true, sellerId: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(watched)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch watched items.' })
  }
}