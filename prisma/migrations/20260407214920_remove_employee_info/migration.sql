/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Employee` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Employee_email_key";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "avatarUrl",
DROP COLUMN "email",
DROP COLUMN "name",
ALTER COLUMN "role" DROP DEFAULT;
