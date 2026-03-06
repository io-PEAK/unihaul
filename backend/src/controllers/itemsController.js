import prisma from '../lib/prisma.js'
import { v2 as cloudinary } from 'cloudinary'

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
      if (list.length > 0) {
        locationFilters.push({ sellerInstitution: { in: list, mode: 'insensitive' } })
      }
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
      if (list.length > 0) {
        locationFilters.push({ sellerState: { in: list } })
      }
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
  const {
    title, description, price, category, subcategory,
    imageUrl,
    images,
    condition, quantity, specs
  } = req.body
  const sellerId = req.user.userId

  const parsedPrice = parseFloat(price)
  if (isNaN(parsedPrice) || parsedPrice <= 0)
    return res.status(400).json({ error: 'Price must be greater than ₹0.' })
  const parsedQuantity = parseInt(quantity) || 1
  if (parsedQuantity < 1)
    return res.status(400).json({ error: 'Quantity must be at least 1.' })

  let imageList = []
  if (Array.isArray(images) && images.length > 0) {
    imageList = images.filter(Boolean)
  } else if (typeof images === 'string' && images) {
    imageList = [images]
  } else if (imageUrl) {
    imageList = [imageUrl]
  }

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
        title,
        description,
        price: parsedPrice,
        category,
        subcategory: subcategory || null,
        imageUrl: imageList[0] || null,
        images:   imageList,
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
  const {
    title, description, price, category, subcategory,
    imageUrl, images,
    status, condition, quantity, specs
  } = req.body
  const userId = req.user.userId

  const parsedPrice = parseFloat(price)
  if (isNaN(parsedPrice) || parsedPrice <= 0)
    return res.status(400).json({ error: 'Price must be greater than ₹0.' })

  const cleanSpecs = specs && typeof specs === 'object'
    ? Object.fromEntries(Object.entries(specs).filter(([_, v]) => v && String(v).trim() !== ''))
    : null

  let imageList = null
  if (Array.isArray(images) && images.length > 0) {
    imageList = images.filter(Boolean)
  } else if (typeof images === 'string' && images) {
    imageList = [images]
  } else if (imageUrl) {
    imageList = [imageUrl]
  }

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
        ...(imageList && {
          imageUrl: imageList[0] || null,
          images:   imageList,
        }),
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

      await Promise.allSettled(
        publicIds.map(publicId => cloudinary.uploader.destroy(publicId))
      )
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