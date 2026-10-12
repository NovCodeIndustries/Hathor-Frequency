-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "temp_password" VARCHAR(300);
