-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('pending', 'published', 'rejected');

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "project" VARCHAR(120),
    "service" VARCHAR(40) NOT NULL,
    "text" VARCHAR(500) NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "status" "review_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");
