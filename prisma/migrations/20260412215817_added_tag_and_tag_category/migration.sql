/*
  Warnings:

  - You are about to drop the column `documentType` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Content` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TagCategory" AS ENUM ('DocumentType', 'ContentType');

-- AlterTable
ALTER TABLE "Content" DROP COLUMN "documentType",
DROP COLUMN "type";

-- DropEnum
DROP TYPE "ContentType";

-- DropEnum
DROP TYPE "DocumentType";

-- CreateTable
CREATE TABLE "ContentTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TagCategory" NOT NULL,

    CONSTRAINT "ContentTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContentToContentTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContentToContentTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ContentToContentTag_B_index" ON "_ContentToContentTag"("B");

-- AddForeignKey
ALTER TABLE "_ContentToContentTag" ADD CONSTRAINT "_ContentToContentTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentToContentTag" ADD CONSTRAINT "_ContentToContentTag_B_fkey" FOREIGN KEY ("B") REFERENCES "ContentTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
