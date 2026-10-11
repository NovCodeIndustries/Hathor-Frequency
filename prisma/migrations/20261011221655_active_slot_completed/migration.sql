-- Una sesión terminada sigue ocupando su horario (PENDING, CONFIRMED y COMPLETED ocupan; CANCELLED lo libera).
-- Prisma no modela índices parciales; si se reescribe esta tabla, conservar este índice.
DROP INDEX IF EXISTS "bookings_active_slot_key";
CREATE UNIQUE INDEX "bookings_active_slot_key" ON "bookings"("date", "start_time") WHERE "status" IN ('pending', 'confirmed', 'completed');
