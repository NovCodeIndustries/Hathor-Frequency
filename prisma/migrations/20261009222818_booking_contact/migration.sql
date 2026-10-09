/*
  Warnings:

  - You are about to drop the column `name` on the `bookings` table. All the data in the column will be lost.
  - Added the required column `phone` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `representative_name` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `representative_type` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `bookings` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "representative_type" AS ENUM ('integrante', 'externo');

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "name",
ADD COLUMN     "phone" VARCHAR(20) NOT NULL,
ADD COLUMN     "project" VARCHAR(120) NOT NULL,
ADD COLUMN     "representative_name" VARCHAR(120) NOT NULL,
ADD COLUMN     "representative_type" "representative_type" NOT NULL,
ALTER COLUMN "email" SET NOT NULL;
