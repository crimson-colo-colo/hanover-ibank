-- CreateTable
CREATE TABLE "UserAnalytics" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "UserAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecentFile" (
    "id" TEXT NOT NULL,
    "analyticsId" TEXT NOT NULL,
    "contentID" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentId" TEXT NOT NULL,

    CONSTRAINT "RecentFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommonFile" (
    "analyticsId" TEXT NOT NULL,
    "contentID" TEXT NOT NULL,
    "openCount" INTEGER NOT NULL DEFAULT 1,
    "contentId" TEXT NOT NULL,

    CONSTRAINT "CommonFile_pkey" PRIMARY KEY ("analyticsId","contentID")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAnalytics_employeeId_key" ON "UserAnalytics"("employeeId");

-- AddForeignKey
ALTER TABLE "UserAnalytics" ADD CONSTRAINT "UserAnalytics_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentFile" ADD CONSTRAINT "RecentFile_analyticsId_fkey" FOREIGN KEY ("analyticsId") REFERENCES "UserAnalytics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentFile" ADD CONSTRAINT "RecentFile_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommonFile" ADD CONSTRAINT "CommonFile_analyticsId_fkey" FOREIGN KEY ("analyticsId") REFERENCES "UserAnalytics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommonFile" ADD CONSTRAINT "CommonFile_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
