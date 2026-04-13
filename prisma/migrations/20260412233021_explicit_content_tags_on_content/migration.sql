/*
  Warnings:

  - The primary key for the `ContentTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ContentTag` table. All the data in the column will be lost.
  - You are about to drop the `_ContentToContentTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('Workflow', 'Reference');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('Object', 'Link');

-- DropForeignKey
ALTER TABLE "_ContentToContentTag" DROP CONSTRAINT "_ContentToContentTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_ContentToContentTag" DROP CONSTRAINT "_ContentToContentTag_B_fkey";

-- AlterTable
ALTER TABLE "ContentTag" DROP CONSTRAINT "ContentTag_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "ContentTag_pkey" PRIMARY KEY ("category", "name");

-- DropTable
DROP TABLE "_ContentToContentTag";

-- CreateTable
CREATE TABLE "ContentTagsOnContent" (
    "contentID" TEXT NOT NULL,
    "tagCategory" "TagCategory" NOT NULL,
    "tagName" TEXT NOT NULL,

    CONSTRAINT "ContentTagsOnContent_pkey" PRIMARY KEY ("contentID","tagCategory","tagName")
);

-- AddForeignKey
ALTER TABLE "ContentTagsOnContent" ADD CONSTRAINT "ContentTagsOnContent_contentID_fkey" FOREIGN KEY ("contentID") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTagsOnContent" ADD CONSTRAINT "ContentTagsOnContent_tagCategory_tagName_fkey" FOREIGN KEY ("tagCategory", "tagName") REFERENCES "ContentTag"("category", "name") ON DELETE RESTRICT ON UPDATE CASCADE;
