// institutions.js
// Unified institution data for Student Shop
// Colleges: from 'indian-colleges' npm package (install: npm install indian-colleges)
// Schools: curated list of top CBSE/ICSE schools across India by state

import { getAllColleges } from 'indian-colleges'

// ── Schools data ──────────────────────────────────────────────
// Curated top schools across India — CBSE, ICSE, State boards
const SCHOOLS = [
  // Delhi
  { name: "Delhi Public School, R.K. Puram", city: "New Delhi", state: "Delhi", board: "CBSE" },
  { name: "Delhi Public School, Vasant Kunj", city: "New Delhi", state: "Delhi", board: "CBSE" },
  { name: "Kendriya Vidyalaya, Andrews Ganj", city: "New Delhi", state: "Delhi", board: "CBSE" },
  { name: "Modern School, Barakhamba Road", city: "New Delhi", state: "Delhi", board: "CBSE" },
  { name: "The Sriram School, Moulsari", city: "New Delhi", state: "Delhi", board: "CBSE" },
  { name: "Sanskriti School", city: "New Delhi", state: "Delhi", board: "CBSE" },
  { name: "Springdales School, Pusa Road", city: "New Delhi", state: "Delhi", board: "CBSE" },
  { name: "St. Columba's School", city: "New Delhi", state: "Delhi", board: "CBSE" },
  { name: "Frank Anthony Public School", city: "New Delhi", state: "Delhi", board: "ICSE" },
  { name: "Bal Bharati Public School, Pitampura", city: "New Delhi", state: "Delhi", board: "CBSE" },
  // Mumbai
  { name: "Dhirubhai Ambani International School", city: "Mumbai", state: "Maharashtra", board: "IB" },
  { name: "Cathedral and John Connon School", city: "Mumbai", state: "Maharashtra", board: "ICSE" },
  { name: "Bombay Scottish School", city: "Mumbai", state: "Maharashtra", board: "ICSE" },
  { name: "The Oberoi International School", city: "Mumbai", state: "Maharashtra", board: "IB" },
  { name: "Campion School", city: "Mumbai", state: "Maharashtra", board: "ICSE" },
  { name: "Jamnabai Narsee School", city: "Mumbai", state: "Maharashtra", board: "CBSE" },
  { name: "Podar International School", city: "Mumbai", state: "Maharashtra", board: "CBSE" },
  { name: "Ryan International School, Malad", city: "Mumbai", state: "Maharashtra", board: "CBSE" },
  // Bangalore
  { name: "Delhi Public School, Bangalore East", city: "Bangalore", state: "Karnataka", board: "CBSE" },
  { name: "Bishop Cotton Boys School", city: "Bangalore", state: "Karnataka", board: "ICSE" },
  { name: "National Public School, Indiranagar", city: "Bangalore", state: "Karnataka", board: "CBSE" },
  { name: "The International School Bangalore", city: "Bangalore", state: "Karnataka", board: "IB" },
  { name: "Clarence High School", city: "Bangalore", state: "Karnataka", board: "ICSE" },
  { name: "St. Joseph's Boys High School", city: "Bangalore", state: "Karnataka", board: "ICSE" },
  { name: "Inventure Academy", city: "Bangalore", state: "Karnataka", board: "CBSE" },
  // Chennai
  { name: "Padma Seshadri Bala Bhavan", city: "Chennai", state: "Tamil Nadu", board: "CBSE" },
  { name: "DAV Boys Senior Secondary School", city: "Chennai", state: "Tamil Nadu", board: "CBSE" },
  { name: "Chettinad Vidyashram", city: "Chennai", state: "Tamil Nadu", board: "CBSE" },
  { name: "Bain High School", city: "Chennai", state: "Tamil Nadu", board: "ICSE" },
  { name: "Chennai Public School", city: "Chennai", state: "Tamil Nadu", board: "CBSE" },
  // Hyderabad
  { name: "Hyderabad Public School, Begumpet", city: "Hyderabad", state: "Telangana", board: "CBSE" },
  { name: "Delhi Public School, Nacharam", city: "Hyderabad", state: "Telangana", board: "CBSE" },
  { name: "Oakridge International School", city: "Hyderabad", state: "Telangana", board: "IB" },
  { name: "Nasr School", city: "Hyderabad", state: "Telangana", board: "CBSE" },
  // Pune
  { name: "The Orchid School", city: "Pune", state: "Maharashtra", board: "CBSE" },
  { name: "Symbiosis School", city: "Pune", state: "Maharashtra", board: "CBSE" },
  { name: "St. Mary's School, Pune", city: "Pune", state: "Maharashtra", board: "ICSE" },
  { name: "Delhi Public School, Pune", city: "Pune", state: "Maharashtra", board: "CBSE" },
  // Kolkata
  { name: "La Martiniere for Boys", city: "Kolkata", state: "West Bengal", board: "ICSE" },
  { name: "St. James School", city: "Kolkata", state: "West Bengal", board: "ICSE" },
  { name: "South Point High School", city: "Kolkata", state: "West Bengal", board: "CBSE" },
  { name: "Don Bosco School, Park Circus", city: "Kolkata", state: "West Bengal", board: "ICSE" },
  // Ahmedabad
  { name: "Udgam School for Children", city: "Ahmedabad", state: "Gujarat", board: "CBSE" },
  { name: "Anand Niketan School", city: "Ahmedabad", state: "Gujarat", board: "CBSE" },
  { name: "Delhi Public School, Bopal", city: "Ahmedabad", state: "Gujarat", board: "CBSE" },
  // Jaipur
  { name: "Maharaja Sawai Man Singh Vidyalaya", city: "Jaipur", state: "Rajasthan", board: "CBSE" },
  { name: "Delhi Public School, Jaipur", city: "Jaipur", state: "Rajasthan", board: "CBSE" },
  { name: "St. Xavier's School, Jaipur", city: "Jaipur", state: "Rajasthan", board: "CBSE" },
  // Chandigarh
  { name: "Bhavan Vidyalaya, Chandigarh", city: "Chandigarh", state: "Chandigarh", board: "CBSE" },
  { name: "Delhi Public School, Chandigarh", city: "Chandigarh", state: "Chandigarh", board: "CBSE" },
  { name: "Strawberry Fields High School", city: "Chandigarh", state: "Chandigarh", board: "CBSE" },
  // Lucknow
  { name: "City Montessori School, Lucknow", city: "Lucknow", state: "Uttar Pradesh", board: "ICSE" },
  { name: "Delhi Public School, Lucknow", city: "Lucknow", state: "Uttar Pradesh", board: "CBSE" },
  { name: "La Martiniere College", city: "Lucknow", state: "Uttar Pradesh", board: "ICSE" },
  // Dehradun (boarding schools)
  { name: "The Doon School", city: "Dehradun", state: "Uttarakhand", board: "CBSE" },
  { name: "Welham Girls School", city: "Dehradun", state: "Uttarakhand", board: "CBSE" },
  { name: "Welham Boys School", city: "Dehradun", state: "Uttarakhand", board: "CBSE" },
  { name: "Rashtriya Indian Military College", city: "Dehradun", state: "Uttarakhand", board: "CBSE" },
]

// ── Helper: normalize college data from npm package ───────────
function normalizeCollege(c) {
  return {
    name:  (c.college || c.name || '').trim(),
    city:  (c.district || c.city || '').trim(),
    state: (c.state || '').trim(),
    type:  'college',
  }
}

function normalizeSchool(s) {
  return {
    name:  s.name.trim(),
    city:  s.city.trim(),
    state: s.state.trim(),
    type:  'school',
    board: s.board,
  }
}

// ── Load all institutions ─────────────────────────────────────
let _cache = null

function loadAll() {
  if (_cache) return _cache
  let colleges = []
  try {
    colleges = getAllColleges().map(normalizeCollege)
  } catch (e) {
    console.warn('indian-colleges package not available, using schools only')
  }
  const schools = SCHOOLS.map(normalizeSchool)
  _cache = [...colleges, ...schools]
  return _cache
}

// ── Public API ────────────────────────────────────────────────

/**
 * Search institutions by name query
 * @param {string} query - search string
 * @param {'college'|'school'|'all'} type - filter by type
 * @param {number} limit - max results (default 20)
 */
export function searchInstitutions(query = '', type = 'all', limit = 20) {
  const all = loadAll()
  const q = query.toLowerCase().trim()
  if (!q) return []
  return all
    .filter(i => {
      const matchesType = type === 'all' || i.type === type
      const matchesQuery = i.name.toLowerCase().includes(q) ||
                           i.city.toLowerCase().includes(q) ||
                           i.state.toLowerCase().includes(q)
      return matchesType && matchesQuery
    })
    .slice(0, limit)
}

/**
 * Get all unique states
 */
export function getStates(type = 'all') {
  const all = loadAll()
  const filtered = type === 'all' ? all : all.filter(i => i.type === type)
  return [...new Set(filtered.map(i => i.state).filter(Boolean))].sort()
}

/**
 * Get institutions by state
 */
export function getByState(state, type = 'all') {
  const all = loadAll()
  return all.filter(i => {
    const matchesState = i.state.toLowerCase() === state.toLowerCase()
    const matchesType  = type === 'all' || i.type === type
    return matchesState && matchesType
  })
}

export default { searchInstitutions, getStates, getByState }