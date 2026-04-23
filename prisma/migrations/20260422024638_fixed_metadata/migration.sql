/*
  Warnings:

  - You are about to drop the column `body` on the `ContentTalkThread` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ContentTalkThread" DROP COLUMN "body",
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedById" TEXT;

-- AddForeignKey
ALTER TABLE "ContentTalkThread" ADD CONSTRAINT "ContentTalkThread_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
