/*
  Warnings:

  - You are about to drop the column `endedAt` on the `ReviewSession` table. All the data in the column will be lost.
  - Added the required column `expiresAt` to the `ReviewSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "repetitions" INTEGER DEFAULT 0,
ALTER COLUMN "interval" SET DEFAULT 0,
ALTER COLUMN "easeFactor" SET DEFAULT 2.5;

-- AlterTable
ALTER TABLE "ReviewSession" DROP COLUMN "endedAt",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "finishedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ReviewSessionCard" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "cardId" INTEGER NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReviewSessionCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSessionCard_sessionId_cardId_key" ON "ReviewSessionCard"("sessionId", "cardId");

-- AddForeignKey
ALTER TABLE "ReviewSessionCard" ADD CONSTRAINT "ReviewSessionCard_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ReviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSessionCard" ADD CONSTRAINT "ReviewSessionCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
