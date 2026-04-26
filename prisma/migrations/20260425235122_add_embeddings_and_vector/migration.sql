CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "Embedding" (
    sourceHash INTEGER NOT NULL PRIMARY KEY,
    embedding VECTOR(1024) NOT NULL
);