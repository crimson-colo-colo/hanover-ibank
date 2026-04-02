/*
  Warnings:

  - Added the required column `documentType` to the `Content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expirationDate` to the `Content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastModifiedDate` to the `Content` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('Incomplete', 'UnderReview', 'Complete');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('Workflow', 'Reference');

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "documentType" "DocumentType" NOT NULL,
ADD COLUMN     "expirationDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "lastModifiedDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "ContentStatus" NOT NULL DEFAULT 'Incomplete';

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "role" SET DEFAULT 'Underwriter';
