-- CreateEnum
CREATE TYPE "ThreadStatus" AS ENUM ('Open', 'Resolved', 'Archived');

-- CreateTable
CREATE TABLE "ContentTalkThread" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "title" TEXT,
    "status" "ThreadStatus" NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "resolvedById" TEXT,

    CONSTRAINT "ContentTalkThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalkThreadComment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "TalkThreadComment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ContentTalkThread" ADD CONSTRAINT "ContentTalkThread_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTalkThread" ADD CONSTRAINT "ContentTalkThread_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalkThreadComment" ADD CONSTRAINT "TalkThreadComment_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ContentTalkThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalkThreadComment" ADD CONSTRAINT "TalkThreadComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
