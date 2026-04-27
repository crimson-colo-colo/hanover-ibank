/*
  Warnings:

  - You are about to drop the column `resolvedAt` on the `ContentTalkThread` table. All the data in the column will be lost.
  - You are about to drop the column `resolvedById` on the `ContentTalkThread` table. All the data in the column will be lost.
  - Added the required column `body` to the `ContentTalkThread` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContentTalkThread" DROP COLUMN "resolvedAt",
DROP COLUMN "resolvedById",
ADD COLUMN     "body" TEXT NOT NULL;
