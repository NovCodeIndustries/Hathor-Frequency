-- CreateTable
CREATE TABLE "birthday_dedications" (
    "id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "for_date" DATE NOT NULL,
    "text" VARCHAR(500) NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "birthday_dedications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "birthday_dedications_recipient_id_for_date_idx" ON "birthday_dedications"("recipient_id", "for_date");

-- CreateIndex
CREATE UNIQUE INDEX "birthday_dedications_recipient_id_author_id_for_date_key" ON "birthday_dedications"("recipient_id", "author_id", "for_date");

-- AddForeignKey
ALTER TABLE "birthday_dedications" ADD CONSTRAINT "birthday_dedications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birthday_dedications" ADD CONSTRAINT "birthday_dedications_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
