-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "checkedOutById" TEXT;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_checkedOutById_fkey" FOREIGN KEY ("checkedOutById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
