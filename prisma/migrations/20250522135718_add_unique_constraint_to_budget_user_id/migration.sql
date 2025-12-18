/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `budgets` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "budgets_userId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "budgets_userId_key" ON "budgets"("userId");
