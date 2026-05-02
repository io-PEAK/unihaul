import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const { PrismaClient } = pkg;
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Auto-migration for Message table columns
(async () => {
  try {
    // Using pool directly for startup migrations to avoid clashing with Prisma adapter initialization
    await pool.query(`
      ALTER TABLE "Message" 
        ADD COLUMN IF NOT EXISTS "fileUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "fileType" TEXT,
        ADD COLUMN IF NOT EXISTS "fileName" TEXT,
        ADD COLUMN IF NOT EXISTS "fileSize" INTEGER,
        ADD COLUMN IF NOT EXISTS "publicId" TEXT,
        ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "isCloudDeleted" BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS "deletedBySender" BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS "deletedByReceiver" BOOLEAN DEFAULT FALSE;

      ALTER TABLE "ChatRequest"
        ADD COLUMN IF NOT EXISTS "deletedBySender" BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS "deletedByReceiver" BOOLEAN DEFAULT FALSE;

      ALTER TABLE "User"
        ADD COLUMN IF NOT EXISTS "upiId" TEXT;
    `);
    // console.log("Database: All table columns verified.");
  } catch (err) {
    console.error("Database: Migration check failed:", err.message);
  }
})();

export default prisma;
