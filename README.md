# Hathor Frequency

Landing page de **Hathor Frequency**, sello discográfico y estudio de producción musical, video y live sessions para bandas emergentes en MX.

Stack: React 19 + TypeScript + Vite · CSS plano con variables · PostgreSQL + Prisma · Docker Compose.

## Levantar el proyecto (recomendado: Docker)

Requisitos: Docker con Compose v2.

```bash
docker compose up --build
```

Esto levanta todo junto:

| Servicio | Qué hace | URL / puerto |
|---|---|---|
| `app` | instala dependencias, genera el cliente Prisma, aplica migraciones y corre Vite | http://localhost:5173 |
| `db` | PostgreSQL 17 con volumen persistente `pgdata` | `localhost:5440` |

No necesitas `.env`: `docker-compose.yml` trae valores por defecto. Para cambiarlos (puertos, usuario, contraseña), copia `.env.example` a `.env`.

Comandos útiles:

```bash
docker compose up -d                          # en segundo plano
docker compose logs -f app                    # logs de Vite / Prisma
docker compose exec app npm run db:migrate    # crear una migración tras editar el schema
docker compose exec app npm run db:studio     # Prisma Studio (añade el puerto 5555 si lo usas)
docker compose down                           # detener (conserva los datos)
docker compose down -v                        # detener y borrar la base
```

También funciona como **devcontainer** (VS Code → "Reopen in Container"): usa el mismo `docker-compose.yml`.

## Compartir un link temporal (Cloudflare)

Con el stack levantado (`docker compose up -d`):

```bash
docker run -d --name hathor-tunnel --network hathor-frequency_default \
  cloudflare/cloudflared:latest tunnel --no-autoupdate --url http://app:5173
docker logs hathor-tunnel 2>&1 | grep trycloudflare.com   # muestra el link público
docker rm -f hathor-tunnel                                 # cerrar el link
```

- **Duración:** el link funciona mientras el equipo, Docker y el túnel sigan encendidos, y cambia cada vez que se reinicia el túnel.
- **Antes de publicar el sitio definitivo:** quitar `allowedHosts: ['.trycloudflare.com']` de `vite.config.ts`. Es solo para este modo de compartir.

## Sin Docker

Requisitos: Node 22+. La base es opcional para el frontend.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # chequeo de tipos + build a /dist
npm run preview   # sirve /dist
npm run lint      # oxlint
```

Para usar Prisma desde el host contra la base del compose: `cp .env.example .env`, `docker compose up -d db` y luego `npm run db:migrate`.

## Estructura

```
docs/DESIGN.md           especificación visual exacta (desktop + móvil)
prisma/schema.prisma     modelos: ContactRequest, Booking
prisma/migrations/       migraciones SQL versionadas
prisma.config.ts         configuración de Prisma 7 (DATABASE_URL)
src/
  data/                  contenido editable: servicios, artistas, cifras, horarios, links
  pages/                 una página por ruta (/, /servicios, /artistas, /reservar, /contacto, /estudio)
  components/            Layout (nav fijo + ticker + footer), una carpeta por sección y shared/
  lib/calendar.ts        utilidades del calendario de Reservar
  lib/submit.ts          punto único de envío de formularios (hoy simulado)
  styles/                tokens.css (:root) y base.css
docker/entrypoint.sh     arranque del contenedor app
```

## Editar contenido

Todo el texto y los datos están en `src/data/`:

- `services.ts`: los 5 servicios (canales de la consola).
- `packages.ts`: los paquetes con precio (vista Paquetes de `/servicios`).
- `artists.ts`: el tracklist, con la bio, redes, videos y fotos de cada artista (panel de detalle).
- `faq.ts`: las preguntas frecuentes.
- `studio.ts`: los espacios, videoclips y live sessions, el equipo y los datos de visita de `/estudio`.
- `stats.ts`: las cifras del hero.
- `booking.ts`: los horarios y servicios del calendario.
- `site.ts`: links del nav, redes, eslogan, testimonio y copyright.

## Base de datos

El esquema ya está listo para recibir lo que envían los formularios:

| Tabla | Para qué |
|---|---|
| `contact_requests` | correos enviados desde Contacto |
| `bookings` | solicitudes de sesión desde Reservar: fecha, hora, servicio y estado |

Los formularios todavía no escriben en la base; ese paso necesita una API. Cuando exista, solo hay que cambiar `src/lib/submit.ts` para que llame a esa API. El cliente Prisma se genera en `server/generated/prisma` (ignorado por git).
