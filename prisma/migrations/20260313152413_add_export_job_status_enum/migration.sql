/*
  Warnings:

  - The `status` column on the `export_job` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "status" AS ENUM ('COMPLETE', 'INCOMPLETE', 'FAIL');

-- AlterTable
ALTER TABLE "export_job" DROP COLUMN "status",
ADD COLUMN     "status" "status" NOT NULL DEFAULT 'INCOMPLETE';
