// Save embeddings for all documents in the database to a JSON file. This is used for testing and debugging.

import { writeFile } from "node:fs/promises"
import { db } from "../server/database.ts"

// model Embedding {
//   hash      Bytes                 @id
//   embedding Unsupported("vector")
//   content  Content[]
//   type     EmbeddingType[]        @default([Unknown])
// }
// enum EmbeddingType {
//   Query
//   Content
//   Unknown
// }

/*
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

*/

const textExtractionCache = await db.textExtractionCache.findMany()

type Embedding = {
	hash: Uint8Array<ArrayBuffer>
	embedding: string
	type: string
	contentId: string
}

const embeddings = await db.$queryRaw<Embedding[]>`
    SELECT "Embedding"."hash", "Embedding"."embedding"::text, "Embedding"."type"::text, "Content"."id" as "contentId"
    FROM "Embedding"
    JOIN "_ContentToEmbedding" ON "Embedding"."hash" = "_ContentToEmbedding"."B"
    JOIN "Content" ON "Content"."id" = "_ContentToEmbedding"."A"
`

await writeFile(
	"embeddings.json",
	JSON.stringify(
		{
			textExtractionCache: textExtractionCache.map((entry) => ({
				hash: entry.hash.toHex(),
				skipRecPDFTextNative: entry.skipRecPDFTextNative,
				skipRecPDFTextOCR: entry.skipRecPDFTextOCR,
				text: entry.text,
			})),
			embeddings: embeddings.map((embedding) => ({
				hash: embedding.hash.toHex(),
				embedding: JSON.parse(embedding.embedding) as number[],
				type: embedding.type
					.slice(1, -1)
					.split(",")
					.map((s) => s.trim()) as string[],
				contentId: embedding.contentId,
			})),
		},
		null,
		2
	)
)

console.log("Embeddings saved to embeddings.json")

await db.$disconnect()
