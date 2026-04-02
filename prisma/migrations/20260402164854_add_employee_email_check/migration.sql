/*
  Warnings:

  - You are about to alter the column `name` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.

*/
-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

ALTER TABLE "Employee" ADD CONSTRAINT email_check CHECK ("email" LIKE '%@hanover.com');
