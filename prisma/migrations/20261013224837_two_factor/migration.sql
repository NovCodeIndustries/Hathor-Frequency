-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "two_factor_at" TIMESTAMPTZ(6),
ADD COLUMN     "two_factor_last_step" INTEGER,
ADD COLUMN     "two_factor_secret" VARCHAR(200);

-- CreateTable
CREATE TABLE "admin_recovery_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_hash" VARCHAR(64) NOT NULL,
    "used_at" TIMESTAMPTZ(6),

    CONSTRAINT "admin_recovery_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_recovery_codes_user_id_idx" ON "admin_recovery_codes"("user_id");

-- AddForeignKey
ALTER TABLE "admin_recovery_codes" ADD CONSTRAINT "admin_recovery_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
