import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const { PrismaClient } = pkg;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

export default prisma;