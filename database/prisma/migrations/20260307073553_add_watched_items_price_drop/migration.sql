-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "message" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "oldPrice" DOUBLE PRECISION,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'sale',
ALTER COLUMN "buyerName" SET DEFAULT '',
ALTER COLUMN "price" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "priceDropAlerts" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "WatchedItem" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "priceAtWatch" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchedItem_userId_itemId_key" ON "WatchedItem"("userId", "itemId");

-- AddForeignKey
ALTER TABLE "WatchedItem" ADD CONSTRAINT "WatchedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchedItem" ADD CONSTRAINT "WatchedItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
