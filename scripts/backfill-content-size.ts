import { db } from "../server/database.ts"
import { bucketName, s3 } from "../server/s3.ts"

async function backfill() {
    const contents = await db.content.findMany({
        where: {
            type: "Object",
            OR: [{ size: null }, { mimeType: null }],
        },
        select: { id: true, objectId: true, title: true },
    })

    console.log(`Found ${contents.length} files to backfill`)

    await Promise.all(
        contents.map(async (content) => {
            try {
                const head = await s3.headObject({
                    Bucket: bucketName,
                    Key: content.objectId!,
                })
                const mimeType = head.Metadata?.filetype ?? head.ContentType ?? "unknown"
                const size = head.ContentLength ?? 0
                await db.content.update({
                    where: { id: content.id },
                    data: { size, mimeType },
                })
                console.log(`✓ ${content.title} — ${size} bytes, ${mimeType}`)
            } catch (err) {
                console.error(`✗ Failed for ${content.title}:`, err)
            }
        })
    )
    console.log("Backfill complete!")
}

backfill()