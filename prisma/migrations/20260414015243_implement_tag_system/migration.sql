/*
  Warnings:

  - You are about to drop the column `documentType` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `intendedAudience` on the `Content` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TagCategory" AS ENUM ('DocumentType', 'IntendedAudience', 'Custom');

-- AlterTable
ALTER TABLE "Content" DROP COLUMN "documentType",
DROP COLUMN "intendedAudience";

-- DropEnum
DROP TYPE "DocumentType";

-- CreateTable
CREATE TABLE "Tag" (
    "name" TEXT NOT NULL,
    "category" "TagCategory" NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("category","name")
);

-- CreateTable
CREATE TABLE "ContentTag" (
    "contentId" TEXT NOT NULL,
    "tagCategory" "TagCategory" NOT NULL,
    "tagName" TEXT NOT NULL,

    CONSTRAINT "ContentTag_pkey" PRIMARY KEY ("contentId","tagCategory","tagName")
);

-- AddForeignKey
ALTER TABLE "ContentTag" ADD CONSTRAINT "ContentTag_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTag" ADD CONSTRAINT "ContentTag_tagCategory_tagName_fkey" FOREIGN KEY ("tagCategory", "tagName") REFERENCES "Tag"("category", "name") ON DELETE RESTRICT ON UPDATE CASCADE;
