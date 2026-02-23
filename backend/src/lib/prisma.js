import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import { createRequire } from 'module';

dotenv.config();

const require = createRequire(import.meta.url);
const { PrismaClient } = require('/Users/peakmac/github/student-shop/database/node_modules/@prisma/client/default.js');

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;