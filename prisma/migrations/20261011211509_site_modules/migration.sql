-- CreateTable
CREATE TABLE "site_draft" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "disabled" TEXT[],
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_by_name" VARCHAR(120),

    CONSTRAINT "site_draft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_versions" (
    "id" UUID NOT NULL,
    "disabled" TEXT[],
    "published_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_by_name" VARCHAR(120) NOT NULL,

    CONSTRAINT "site_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_versions_published_at_idx" ON "site_versions"("published_at");
