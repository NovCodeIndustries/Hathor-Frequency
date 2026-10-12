-- CreateTable
CREATE TABLE "site_maintenance" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "message" VARCHAR(300),
    "until" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_by_name" VARCHAR(120),

    CONSTRAINT "site_maintenance_pkey" PRIMARY KEY ("id")
);
