import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { faker } from '@faker-js/faker'
import { readFileSync } from 'fs'
import { join } from 'path'

const __dir = __dirname

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ── Load indiaCities.json from frontend — real city+state pairs ──
// Path: database/prisma/seed.ts → ../../frontend/src/data/indiaCities.json
const indiaCities: Record<string, string[]> = JSON.parse(
  readFileSync(join(__dir, '../../frontend/src/data/indiaCities.json'), 'utf8')
)

// Build a flat array of { city, state } pairs from the JSON
// Filter to major states only so seed data feels realistic
const MAJOR_STATES = [
  'Delhi', 'Maharashtra', 'Tamil Nadu', 'Karnataka', 'Telangana',
  'Rajasthan', 'West Bengal', 'Gujarat', 'Uttar Pradesh', 'Bihar',
  'Madhya Pradesh', 'Punjab', 'Haryana', 'Chandigarh', 'Uttarakhand',
  'Assam', 'Kerala', 'Andhra Pradesh', 'Odisha', 'Jharkhand',
]

const CITY_STATE_PAIRS: { city: string; state: string }[] = []
for (const state of MAJOR_STATES) {
  const cities = indiaCities[state] || []
  // take up to 10 cities per state so the data is spread well
  const sample = faker.helpers.shuffle(cities).slice(0, 15)
  for (const city of sample) {
    CITY_STATE_PAIRS.push({ city, state })
  }
}

console.log(`📍 Loaded ${CITY_STATE_PAIRS.length} city+state pairs from indiaCities.json`)

// ── Constants matching your real app data ──────────────────────
const CATEGORIES: Record<string, string[]> = {
  'Books & Notes':    ['1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', 'Reference Books', 'Notes'],
  'Electronics':      ['Phones', 'Laptops', 'Tablets', 'Earphones', 'Chargers', 'Accessories'],
  'Food & Drinks':    ['Snacks', 'Beverages', 'Homemade', 'Meal Plans'],
  'Clothing':         ['Tops', 'Bottoms', 'Shoes', 'Accessories', 'Uniforms'],
  'Furniture':        ['Chairs', 'Tables', 'Beds', 'Shelves', 'Lamps'],
  'Sports & Fitness': ['Cricket', 'Football', 'Badminton', 'Gym Equipment', 'Cycles'],
  'Stationery':       ['Pens', 'Notebooks', 'Art Supplies', 'Calculators'],
  'Appliances':       ['Fan', 'Iron', 'Kettle', 'Heater', 'Extension Boards'],
  'Games & Hobbies':  ['Board Games', 'Video Games', 'Cards', 'Musical Instruments'],
  'Services':         ['Tutoring', 'Designing', 'Coding Help', 'Photography'],
  'Other':            ['Miscellaneous'],
}
const CATEGORY_NAMES = Object.keys(CATEGORIES)
const CONDITIONS     = ['New', 'Like New', 'Good', 'Fair', 'Poor']
const STATUSES       = ['available', 'available', 'available', 'pending', 'sold']
const THEMES         = ['ember', 'ember', 'ember', 'midnight', 'chalk']
const INST_TYPES     = ['college', 'college', 'college', 'school']
const MSG_TEMPLATES  = [
  'Is this still available?',
  'Can you do a lower price?',
  'Where can we meet for the handover?',
  'What condition is it exactly?',
  'Is there any warranty left?',
  'Can I see it before buying?',
  'Does it come with all accessories?',
  'How old is this?',
  'Any scratches or damage?',
  'Can you deliver to the hostel?',
]

async function main() {
  console.log('🌱 Starting seed...')

  // Clear in correct FK order (children before parents)
  await prisma.notification.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.message.deleteMany()
  await prisma.item.deleteMany()
  await prisma.user.deleteMany()
  console.log('🗑️  Cleared existing data')

  // ─── USERS (100) ───────────────────────────────────────────
  const users = []
  for (let i = 0; i < 100; i++) {
    // pick a real city+state pair — guaranteed to match
    const { city, state } = faker.helpers.arrayElement(CITY_STATE_PAIRS)
    const firstName = faker.person.firstName()
    const lastName  = faker.person.lastName()
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email:        faker.internet.email({ firstName, lastName }).toLowerCase(),
        passwordHash: faker.string.alphanumeric(60),
        phone:        faker.helpers.maybe(() => faker.phone.number(), { probability: 0.7 }),
        avatar:       faker.helpers.maybe(() => faker.image.avatar(),  { probability: 0.5 }),
        bio:          faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.4 }),
        institution:     faker.company.name() + ' ' + faker.helpers.arrayElement(['College', 'Institute', 'University', 'School']),
        institutionType: faker.helpers.arrayElement(INST_TYPES),
        city,
        state,
        notificationsEnabled: true,
        saleNotifications:    faker.datatype.boolean({ probability: 0.85 }),
        messageNotifications: faker.datatype.boolean({ probability: 0.90 }),
        theme:          faker.helpers.arrayElement(THEMES),
        googleId:       null,
        authProvider:   'local',
        profileComplete: true,
      },
    })
    users.push(user)
  }
  console.log(`✅ Created ${users.length} users`)

  // ─── ITEMS (300) ───────────────────────────────────────────
  // items inherit seller's city+state — guaranteed correct pairs
  const items = []
  for (let i = 0; i < 300; i++) {
    const seller      = faker.helpers.arrayElement(users)
    const category    = faker.helpers.arrayElement(CATEGORY_NAMES)
    const subcategory = faker.helpers.arrayElement(CATEGORIES[category])
    const item = await prisma.item.create({
      data: {
        title:       faker.commerce.productName(),
        price:       parseFloat(faker.commerce.price({ min: 50, max: 5000 })),
        category,
        condition:   faker.helpers.arrayElement(CONDITIONS),
        description: faker.helpers.maybe(() => faker.commerce.productDescription(), { probability: 0.8 }),
        subcategory,
        status:      faker.helpers.arrayElement(STATUSES),
        quantity:    faker.helpers.arrayElement([1, 1, 1, 2, 3]),
        specs:       faker.helpers.maybe(() => ({
          brand:  faker.company.name(),
          model:  faker.string.alphanumeric(6).toUpperCase(),
          color:  faker.color.human(),
        }), { probability: 0.3 }),
        imageUrl: faker.helpers.maybe(() => `https://picsum.photos/seed/${faker.string.alphanumeric(6)}/400/300`, { probability: 0.7 }),
        images:   [],
        // seller's city+state flows into item — this is what location filter queries
        sellerInstitution:     seller.institution,
        sellerInstitutionType: seller.institutionType,
        sellerCity:            seller.city,
        sellerState:           seller.state,
        sellerId: seller.id,
      },
    })
    items.push(item)
  }
  console.log(`✅ Created ${items.length} items`)

  // ─── MESSAGES (200) ────────────────────────────────────────
  for (let i = 0; i < 200; i++) {
    const sender   = faker.helpers.arrayElement(users)
    const receiver = faker.helpers.arrayElement(users.filter(u => u.id !== sender.id))
    const item     = faker.helpers.arrayElement(items)
    await prisma.message.create({
      data: {
        content:    faker.helpers.arrayElement(MSG_TEMPLATES),
        read:       faker.datatype.boolean({ probability: 0.6 }),
        senderId:   sender.id,
        receiverId: receiver.id,
        itemId:     item.id,
      },
    })
  }
  console.log(`✅ Created 200 messages`)

  // ─── TRANSACTIONS (100) ────────────────────────────────────
  for (let i = 0; i < 100; i++) {
    const item  = faker.helpers.arrayElement(items)
    const buyer = faker.helpers.arrayElement(users.filter(u => u.id !== item.sellerId))
    await prisma.transaction.create({
      data: {
        status:       faker.helpers.arrayElement(['pending', 'completed', 'cancelled']),
        quantity:     1,
        price:        item.price,
        itemTitle:    item.title,
        itemCategory: item.category,
        itemId:       item.id,
        buyerId:      buyer.id,
        sellerId:     item.sellerId,
      },
    })
  }
  console.log(`✅ Created 100 transactions`)

  // ─── NOTIFICATIONS (for completed transactions) ─────────────
  const completedTxns = await prisma.transaction.findMany({ where: { status: 'completed' } })
  for (const txn of completedTxns) {
    const buyer = users.find(u => u.id === txn.buyerId)
    const buyerName = buyer ? `${buyer.firstName} ${buyer.lastName}`.trim() : 'Unknown Buyer'
    await prisma.notification.create({
      data: {
        userId:    txn.sellerId,
        itemId:    txn.itemId,
        itemTitle: txn.itemTitle,
        buyerName,
        price:     txn.price,
        seen:      faker.datatype.boolean({ probability: 0.4 }),
      },
    })
  }
  console.log(`✅ Created ${completedTxns.length} notifications`)

  console.log('\n🎉 Database seeded successfully!')
  console.log(`   Users: 100 | Items: 300 | Messages: 200 | Transactions: 100`)
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })