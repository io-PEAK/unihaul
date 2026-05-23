import 'dotenv/config'

export default {
  schema: './database/prisma/schema.prisma',
  datasource: {
  url: process.env.DIRECT_URL,
  },
  migrations: { 
    seed: 'ts-node database/prisma/seed.ts',
  },
}