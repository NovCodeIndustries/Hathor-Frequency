-- AlterTable
ALTER TABLE "admin_sessions" ADD COLUMN     "ip" VARCHAR(64),
ADD COLUMN     "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_agent" VARCHAR(300);

-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "failed_logins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "locked_until" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "admin_login_events" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "user_id" UUID,
    "success" BOOLEAN NOT NULL,
    "reason" VARCHAR(20),
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(300),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_login_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_login_events_created_at_idx" ON "admin_login_events"("created_at");

-- CreateIndex
CREATE INDEX "admin_login_events_user_id_idx" ON "admin_login_events"("user_id");

-- AddForeignKey
ALTER TABLE "admin_login_events" ADD CONSTRAINT "admin_login_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
