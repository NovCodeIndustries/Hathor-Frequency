/*
  Warnings:

  - Added the required column `name` to the `contact_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topic` to the `contact_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contact_requests" ADD COLUMN     "name" VARCHAR(120) NOT NULL,
ADD COLUMN     "topic" VARCHAR(40) NOT NULL;
