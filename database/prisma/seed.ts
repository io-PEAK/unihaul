import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { faker } from '@faker-js/faker'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting seed...')


  await prisma.transaction.deleteMany()
  await prisma.message.deleteMany()
  await prisma.item.deleteMany()
  await prisma.user.deleteMany()
  console.log('🗑️  Cleared existing data')

  // ─── USERS (100) ───────────────────────────────────────────
  const users = []
  for (let i = 0; i < 100; i++) {
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        passwordHash: faker.string.alphanumeric(60),
      },
    })
    users.push(user)
  }
  console.log(`✅ Created ${users.length} users`)

  // ─── ITEMS (500) ───────────────────────────────────────────
  const categories = ['Books', 'Electronics', 'Furniture', 'Clothing', 'Sports', 'Stationery', 'Appliances', 'Other']
  const conditions = ['New', 'Excellent', 'Good', 'Fair', 'Poor']
  const statuses = ['available', 'pending', 'sold']

  const items = []
  for (let i = 0; i < 500; i++) {
    const item = await prisma.item.create({
      data: {
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ min: 50, max: 5000 })),
        category: faker.helpers.arrayElement(categories),
        condition: faker.helpers.arrayElement(conditions),
        status: faker.helpers.arrayElement(statuses),
        imageUrl: faker.image.url(),
        sellerId: faker.helpers.arrayElement(users).id,
      },
    })
    items.push(item)
  }
  console.log(`✅ Created ${items.length} items`)

  // ─── MESSAGES (500) ────────────────────────────────────────
  for (let i = 0; i < 500; i++) {
    const sender = faker.helpers.arrayElement(users)
    const receiver = faker.helpers.arrayElement(users.filter(u => u.id !== sender.id))
    const item = faker.helpers.arrayElement(items)

    await prisma.message.create({
      data: {
        content: faker.helpers.arrayElement([
          'Is this still available?',
          'Can you do a lower price?',
          'Where can we meet?',
          'What condition is it in?',
          'Is there any warranty?',
          faker.lorem.sentence(),
        ]),
        senderId: sender.id,
        receiverId: receiver.id,
        itemId: item.id,
      },
    })
  }
  console.log(`✅ Created 500 messages`)

  // ─── TRANSACTIONS (500) ────────────────────────────────────
  for (let i = 0; i < 500; i++) {
    const item = faker.helpers.arrayElement(items)
    const buyer = faker.helpers.arrayElement(users.filter(u => u.id !== item.sellerId))

    await prisma.transaction.create({
      data: {
        itemId: item.id,
        buyerId: buyer.id,
        sellerId: item.sellerId,
        status: faker.helpers.arrayElement(['pending', 'completed', 'cancelled']),
      },
    })
  }
  console.log(`✅ Created 500 transactions`)

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })