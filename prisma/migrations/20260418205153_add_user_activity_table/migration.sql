-- CreateTable
CREATE TABLE "UserActivity" (
    "timestamp" TIMESTAMP(3) NOT NULL,
    "employeeId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "day" TIMESTAMP(3) NOT NULL,
    "hour" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("timestamp","employeeId","path")
);

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
