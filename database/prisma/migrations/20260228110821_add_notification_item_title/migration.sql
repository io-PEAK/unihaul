-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_itemId_fkey";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "itemTitle" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "itemId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
