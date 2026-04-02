/*
  Warnings:

  - A unique constraint covering the columns `[senderId,receiverId,itemId]` on the table `ChatRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_itemId_fkey";

-- DropIndex
DROP INDEX "ChatRequest_senderId_receiverId_key";

-- AlterTable
ALTER TABLE "ChatRequest" ADD COLUMN     "itemId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "ChatRequest_senderId_receiverId_itemId_key" ON "ChatRequest"("senderId", "receiverId", "itemId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRequest" ADD CONSTRAINT "ChatRequest_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
