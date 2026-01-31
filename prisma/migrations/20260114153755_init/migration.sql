/*
  Warnings:

  - You are about to drop the column `answer` on the `Card` table. All the data in the column will be lost.
  - Added the required column `rightAnswer` to the `Card` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Card" DROP COLUMN "answer",
ADD COLUMN     "answers" TEXT[],
ADD COLUMN     "rightAnswer" TEXT NOT NULL;
