/*
  Warnings:

  - You are about to drop the column `data` on the `DailyStats` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[date,userId]` on the table `DailyStats` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `DailyStats` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DailyStats_data_userId_key";

-- DropIndex
DROP INDEX "DailyStats_userId_data_idx";

-- AlterTable
ALTER TABLE "DailyStats" DROP COLUMN "data",
ADD COLUMN     "date" DATE NOT NULL;

-- CreateIndex
CREATE INDEX "DailyStats_userId_date_idx" ON "DailyStats"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStats_date_userId_key" ON "DailyStats"("date", "userId");
