-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('Object', 'Link');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "objectId" TEXT,
    "url" TEXT,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Custom: validate value columns based on type
ALTER TABLE "Content" ADD CONSTRAINT "Content_type_check" CHECK (
    ("type" = 'Object' AND "objectId" IS NOT NULL AND "url" IS NULL) OR
    ("type" = 'Link' AND "objectId" IS NULL AND "url" IS NOT NULL)
);