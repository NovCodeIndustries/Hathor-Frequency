-- CreateTable
CREATE TABLE "plugin_releases" (
    "id" UUID NOT NULL,
    "plugin_id" VARCHAR(40) NOT NULL,
    "version" VARCHAR(30) NOT NULL,
    "notes" VARCHAR(2000) NOT NULL,
    "mac_path" VARCHAR(500),
    "win_path" VARCHAR(500),
    "current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_name" VARCHAR(120) NOT NULL,

    CONSTRAINT "plugin_releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugin_downloads" (
    "id" UUID NOT NULL,
    "plugin_id" VARCHAR(40) NOT NULL,
    "release_id" UUID,
    "target" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plugin_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plugin_releases_plugin_id_created_at_idx" ON "plugin_releases"("plugin_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "plugin_releases_plugin_id_version_key" ON "plugin_releases"("plugin_id", "version");

-- CreateIndex
CREATE INDEX "plugin_downloads_plugin_id_created_at_idx" ON "plugin_downloads"("plugin_id", "created_at");

-- CreateIndex
CREATE INDEX "plugin_downloads_created_at_idx" ON "plugin_downloads"("created_at");

-- AddForeignKey
ALTER TABLE "plugin_downloads" ADD CONSTRAINT "plugin_downloads_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "plugin_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Una sola versión actual por plugin (Prisma no modela índices parciales: conservarlo)
CREATE UNIQUE INDEX "plugin_releases_current_key" ON "plugin_releases"("plugin_id") WHERE "current";
