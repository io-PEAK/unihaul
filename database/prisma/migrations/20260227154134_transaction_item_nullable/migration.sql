-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_itemId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "itemId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
