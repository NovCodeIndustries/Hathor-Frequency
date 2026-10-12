-- CreateEnum
CREATE TYPE "admin_role" AS ENUM ('admin', 'agenda');

-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "role" "admin_role" NOT NULL DEFAULT 'admin';
