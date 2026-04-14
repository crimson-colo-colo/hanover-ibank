/*
  Warnings:

  - Added the required column `updatedAt` to the `Content` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "checkedOutById" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_checkedOutById_fkey" FOREIGN KEY ("checkedOutById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
