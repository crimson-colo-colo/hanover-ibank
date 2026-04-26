/*
  Warnings:

  - The primary key for the `Embedding` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `sourcehash` on the `Embedding` table. All the data in the column will be lost.
  - Added the required column `hash` to the `Embedding` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Embedding" DROP CONSTRAINT "Embedding_pkey",
DROP COLUMN "sourcehash",
ADD COLUMN     "hash" BYTEA NOT NULL,
ADD CONSTRAINT "Embedding_pkey" PRIMARY KEY ("hash");

-- CreateTable
CREATE TABLE "_ContentToEmbedding" (
    "A" TEXT NOT NULL,
    "B" BYTEA NOT NULL,

    CONSTRAINT "_ContentToEmbedding_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ContentToEmbedding_B_index" ON "_ContentToEmbedding"("B");

-- AddForeignKey
ALTER TABLE "_ContentToEmbedding" ADD CONSTRAINT "_ContentToEmbedding_A_fkey" FOREIGN KEY ("A") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentToEmbedding" ADD CONSTRAINT "_ContentToEmbedding_B_fkey" FOREIGN KEY ("B") REFERENCES "Embedding"("hash") ON DELETE CASCADE ON UPDATE CASCADE;
