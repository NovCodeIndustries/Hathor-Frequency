-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "views" TEXT[] DEFAULT ARRAY['agenda', 'contactos']::TEXT[];
