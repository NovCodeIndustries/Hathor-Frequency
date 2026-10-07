#!/bin/sh
# Arranque del contenedor app: dependencias al día, cliente Prisma y migraciones.
set -e

# node_modules vive en un volumen; si package-lock.json cambió, se reinstala.
LOCK_HASH="$(sha256sum package-lock.json | cut -d' ' -f1)"
if [ ! -f node_modules/.lock-hash ] || [ "$(cat node_modules/.lock-hash)" != "$LOCK_HASH" ]; then
  echo "→ Instalando dependencias…"
  npm ci --no-audit --no-fund
  echo "$LOCK_HASH" > node_modules/.lock-hash
fi

echo "→ Generando cliente Prisma…"
npx prisma generate
# El contenedor corre como root: devolver el cliente generado al dueño del repo
chown -R "$(stat -c '%u:%g' /app)" server

echo "→ Aplicando migraciones…"
npx prisma migrate deploy

exec "$@"
