#!/bin/sh
# Arranque de los contenedores. Con HF_SETUP=1 (servicio `migrate`): dependencias al día, cliente Prisma
# y migraciones. `web` y `panel` arrancan después de `migrate` y solo ejecutan su comando.
set -e

if [ "$HF_SETUP" != "1" ]; then
  exec "$@"
fi

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
