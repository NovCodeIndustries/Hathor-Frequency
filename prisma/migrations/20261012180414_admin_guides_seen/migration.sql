-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "guides_seen" TEXT[] DEFAULT ARRAY[]::TEXT[];
