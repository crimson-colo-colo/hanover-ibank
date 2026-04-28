-- CreateTable
CREATE TABLE "RecentTimestamps" (
    "recentlyEdited" TIMESTAMP(3) NOT NULL,
    "recentlyViewed" TIMESTAMP(3) NOT NULL,
    "employeeId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,

    CONSTRAINT "RecentTimestamps_pkey" PRIMARY KEY ("employeeId","contentId")
);

-- AddForeignKey
ALTER TABLE "RecentTimestamps" ADD CONSTRAINT "RecentTimestamps_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentTimestamps" ADD CONSTRAINT "RecentTimestamps_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
