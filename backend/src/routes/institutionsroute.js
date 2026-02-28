import express from 'express'
import { searchInstitutions, getStates } from '../data/institutions.js'

const router = express.Router()

// GET /institutions/search?q=iit&type=college&limit=20
router.get('/search', (req, res) => {
  const { q = '', type = 'all', limit = 20 } = req.query
  const results = searchInstitutions(q, type, parseInt(limit))
  res.json(results)
})

// GET /institutions/states?type=college
router.get('/states', (req, res) => {
  const { type = 'all' } = req.query
  res.json(getStates(type))
})

export default router