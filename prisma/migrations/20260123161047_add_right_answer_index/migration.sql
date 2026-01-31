/*
  Warnings:

  - You are about to drop the column `rightAnswer` on the `Card` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Card" DROP COLUMN "rightAnswer",
ADD COLUMN     "rightAnswerIndex" INTEGER NOT NULL DEFAULT 0;
