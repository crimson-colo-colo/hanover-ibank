-- DropForeignKey
ALTER TABLE "ContentTag" DROP CONSTRAINT "ContentTag_tagCategory_tagName_fkey";

-- DropForeignKey
ALTER TABLE "ContentTalkThread" DROP CONSTRAINT "ContentTalkThread_createdById_fkey";

-- DropForeignKey
ALTER TABLE "FavoriteContent" DROP CONSTRAINT "FavoriteContent_contentId_fkey";

-- DropForeignKey
ALTER TABLE "FavoriteContent" DROP CONSTRAINT "FavoriteContent_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "RecentTimestamps" DROP CONSTRAINT "RecentTimestamps_contentId_fkey";

-- DropForeignKey
ALTER TABLE "RecentTimestamps" DROP CONSTRAINT "RecentTimestamps_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "TalkThreadComment" DROP CONSTRAINT "TalkThreadComment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "UserActivity" DROP CONSTRAINT "UserActivity_employeeId_fkey";

-- AddForeignKey
ALTER TABLE "ContentTalkThread" ADD CONSTRAINT "ContentTalkThread_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalkThreadComment" ADD CONSTRAINT "TalkThreadComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTag" ADD CONSTRAINT "ContentTag_tagCategory_tagName_fkey" FOREIGN KEY ("tagCategory", "tagName") REFERENCES "Tag"("category", "name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteContent" ADD CONSTRAINT "FavoriteContent_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteContent" ADD CONSTRAINT "FavoriteContent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentTimestamps" ADD CONSTRAINT "RecentTimestamps_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentTimestamps" ADD CONSTRAINT "RecentTimestamps_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
