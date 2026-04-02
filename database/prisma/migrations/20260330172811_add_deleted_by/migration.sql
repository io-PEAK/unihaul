-- AlterTable
ALTER TABLE "ChatRequest" ADD COLUMN     "deletedByReceiver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletedBySender" BOOLEAN NOT NULL DEFAULT false;
