-- CreateTable
CREATE TABLE "FavoriteContent" (
    "contentId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "FavoriteContent_pkey" PRIMARY KEY ("contentId","employeeId")
);

-- AddForeignKey
ALTER TABLE "FavoriteContent" ADD CONSTRAINT "FavoriteContent_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteContent" ADD CONSTRAINT "FavoriteContent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
