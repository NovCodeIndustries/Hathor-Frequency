-- El panel ya no usa correo: cada quien entra con su usuario ("jnunez"), armado igual que el correo de antes
DROP INDEX "admin_users_email_key";
ALTER TABLE "admin_users" RENAME COLUMN "email" TO "username";
UPDATE "admin_users" SET "username" = lower(split_part("username", '@', 1));
-- Si dos quedan iguales al quitar el dominio, a los siguientes se les agrega un número
WITH d AS (SELECT "id", "username", row_number() OVER (PARTITION BY "username" ORDER BY "created_at") AS n FROM "admin_users")
UPDATE "admin_users" u SET "username" = d."username" || d.n FROM d WHERE u."id" = d."id" AND d.n > 1;
ALTER TABLE "admin_users" ALTER COLUMN "username" TYPE VARCHAR(60);
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- El registro de accesos guarda el usuario que se escribió
ALTER TABLE "admin_login_events" RENAME COLUMN "email" TO "username";
