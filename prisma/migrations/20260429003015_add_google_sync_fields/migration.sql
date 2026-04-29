-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "googleEventId" TEXT,
ADD COLUMN     "syncToGoogle" BOOLEAN NOT NULL DEFAULT false;
