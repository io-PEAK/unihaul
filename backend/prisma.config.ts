import 'dotenv/config'

export default {
  schema: './database/prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,     // pooled connection string
  },
  migrations: {
    seed: 'ts-node database/prisma/seed.ts',
  },
}