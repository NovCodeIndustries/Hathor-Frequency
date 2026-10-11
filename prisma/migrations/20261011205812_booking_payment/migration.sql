-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'deposit', 'paid');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "amount_cents" INTEGER,
ADD COLUMN     "deposit_cents" INTEGER,
ADD COLUMN     "paid_at" TIMESTAMPTZ(6),
ADD COLUMN     "payment_status" "payment_status" NOT NULL DEFAULT 'pending';
