/*
  Warnings:

  - You are about to drop the column `quality` on the `ReviewLog` table. All the data in the column will be lost.
  - Added the required column `success` to the `ReviewLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ReviewLog" DROP COLUMN "quality",
ADD COLUMN     "success" BOOLEAN NOT NULL;
