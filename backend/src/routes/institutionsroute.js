import express from 'express'
import institutions from '../data/institutionsController.js'
import prisma from '../lib/prisma.js'

const { searchInstitutions, getStates } = institutions
const router = express.Router()

// GET /institutions/search?q=&type=&limit=&state=
router.get('/search', async (req, res) => {
  try {
    const { q = '', type = 'all', limit = 20, state = '' } = req.query
    const lim = Math.min(parseInt(limit) || 20, 50)

    // Source 1 — local dataset (highest priority)
    // when state is provided, returns all institutions in that state (used by LocationPicker to load cities)
    const local = searchInstitutions(q, type, lim, state)
    const seen = new Set(local.map(i => i.name.toLowerCase()))
    const merged = [...local]

    // skip DB sources if this is just a state→cities lookup (no query needed)
    if (q.trim()) {
      // Source 2 — user-submitted unknowns
      const suggested = await prisma.suggestedInstitution.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
          ...(type !== 'all' ? { type } : {}),
          ...(state ? { state: { equals: state, mode: 'insensitive' } } : {})
        },
        orderBy: { count: 'desc' },
        take: lim
      })
      for (const s of suggested) {
        if (!seen.has(s.name.toLowerCase())) {
          merged.push({ name: s.name, city: s.city || '', state: s.state || '', type: s.type })
          seen.add(s.name.toLowerCase())
        }
      }

      // Source 3 — distinct institutions from user profiles
      const userInsts = await prisma.user.findMany({
        where: {
          institution: { contains: q, mode: 'insensitive' },
          ...(type !== 'all' ? { institutionType: type } : {}),
          ...(state ? { state: { equals: state, mode: 'insensitive' } } : {})
        },
        select: { institution: true, institutionType: true, city: true, state: true },
        distinct: ['institution'],
        take: lim
      })
      for (const u of userInsts) {
        if (u.institution && !seen.has(u.institution.toLowerCase())) {
          merged.push({ name: u.institution, city: u.city || '', state: u.state || '', type: u.institutionType || 'college' })
          seen.add(u.institution.toLowerCase())
        }
      }
    }

    res.json(merged.slice(0, lim))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Search failed' })
  }
})

// POST /institutions/suggest
router.post('/suggest', async (req, res) => {
  try {
    const { name, city, state, type = 'college' } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' })

    const localMatch = searchInstitutions(name, 'all', 1)
      .find(i => i.name.toLowerCase() === name.toLowerCase().trim())
    if (localMatch) return res.json({ stored: false, reason: 'already_in_dataset' })

    const result = await prisma.suggestedInstitution.upsert({
      where: { name: name.trim() },
      update: { count: { increment: 1 } },
      create: { name: name.trim(), city: city?.trim() || '', state: state?.trim() || '', type }
    })

    res.json({ stored: true, institution: result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to suggest institution' })
  }
})

// GET /institutions/states
router.get('/states', (req, res) => {
  try {
    const { type = 'all' } = req.query
    res.json(getStates(type))
  } catch (err) {
    res.status(500).json({ error: 'Failed to get states' })
  }
})

export default router