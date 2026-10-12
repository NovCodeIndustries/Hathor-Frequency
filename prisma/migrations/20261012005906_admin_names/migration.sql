-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "first_name" VARCHAR(60) NOT NULL DEFAULT '',
ADD COLUMN     "last_name" VARCHAR(60) NOT NULL DEFAULT '',
ADD COLUMN     "middle_name" VARCHAR(60),
ADD COLUMN     "phone" VARCHAR(20),
ADD COLUMN     "second_last_name" VARCHAR(60);

-- Usuarios que ya existían: su nombre completo pasa a primer nombre (se puede corregir desde el panel)
UPDATE "admin_users" SET "first_name" = LEFT("name", 60) WHERE "first_name" = '';
