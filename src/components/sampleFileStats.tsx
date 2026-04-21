import {queryClient, trpc} from "@/lib/trpc.ts"
import {useQuery} from "@tanstack/react-query";
//this file serves no actual purpose at the moment, this is just so I (julien) have a baseline of what to do when the frontend comes into play

//for the fileSize, this converts it to kilo and megabytes
function formatBytes(bytes: number): string {
    if(bytes < 1024)
        return `${bytes} Bytes`

    if(bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KiloBytes`

    return `${(bytes / (1024 * 1024)).toFixed(1)} MegaBytes`
}

//this is a date formatting function
function formatDate(date:Date): string {
    const d = new Date(date)
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

//example usage of procedure, and formatting functions
export function FileStats({ contentID } : { contentID: string }) {
    const { data, isLoading } = useQuery(
        trpc.content.getFileStats.queryOptions({ id: contentID }),
        queryClient
    )
    if (isLoading) return <p>Loading...</p>
    if (!data) return null

    return(
        <div>
            <p>File Type: {data.fileType}</p>
            <p>Created At: {formatDate(data.creationDate)}</p>
            <p>Last Modified: {formatDate(data.lastModifiedDate)}</p>
            <p>Expiration Date: {formatDate(data.expirationDate)}</p>
        </div>

    )

}