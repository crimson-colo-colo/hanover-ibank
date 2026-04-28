-- CreateEnum
CREATE TYPE "EmbeddingType" AS ENUM ('Query', 'Content', 'Unknown');

-- AlterTable
ALTER TABLE "Embedding" ADD COLUMN     "type" "EmbeddingType"[] DEFAULT ARRAY['Unknown']::"EmbeddingType"[];

-- CreateTable
CREATE TABLE "TextExtractionCache" (
    "hash" BYTEA NOT NULL,
    "skipRecPDFTextNative" BOOLEAN NOT NULL,
    "skipRecPDFTextOCR" BOOLEAN NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "TextExtractionCache_pkey" PRIMARY KEY ("hash","skipRecPDFTextNative","skipRecPDFTextOCR")
);
