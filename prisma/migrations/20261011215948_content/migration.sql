-- CreateTable
CREATE TABLE "content_drafts" (
    "key" VARCHAR(40) NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_by_name" VARCHAR(120),

    CONSTRAINT "content_drafts_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" UUID NOT NULL,
    "key" VARCHAR(40) NOT NULL,
    "data" JSONB NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "published_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_by_name" VARCHAR(120) NOT NULL,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_versions_key_published_at_idx" ON "content_versions"("key", "published_at");
