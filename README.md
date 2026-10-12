# Hathor Frequency

Landing page de **Hathor Frequency**, sello discográfico y estudio de producción musical, video y live sessions para bandas emergentes en MX.

Stack: React 19 + TypeScript + Vite · API con Hono (Node) · CSS plano con variables · PostgreSQL + Prisma · Docker Compose.

## Levantar el proyecto (recomendado: Docker)

Requisitos: Docker con Compose v2.

```bash
docker compose up --build
```

Esto levanta todo junto:

| Servicio | Qué hace | URL / puerto |
|---|---|---|
| `migrate` | corre una vez: instala dependencias, genera el cliente Prisma y aplica migraciones | — |
| `web` | sitio público + su API (`server/web`) | http://localhost:5173 (API en `/api`) |
| `panel` | panel del estudio + su API (`server/panel`), servicio aparte | http://localhost:5180/admin |
| `db` | PostgreSQL 17 con volumen persistente `pgdata` | `localhost:5440` |
| `umami` + `umami-db` | analítica de visitas (sin cookies) para el dashboard | http://localhost:3100 |

Toda la configuración vive en **`.env`**, el único archivo de entorno, que queda fuera de git: puertos, base, usuario principal, medios y Umami. `docker-compose.yml` trae valores por defecto para lo que falte. En un equipo nuevo, crea `.env` con las mismas claves.

Comandos útiles:

```bash
docker compose up -d                          # en segundo plano
docker compose logs -f web panel              # logs de Vite y de las APIs
docker compose stop panel                     # mantenimiento del panel: la web sigue funcionando
docker compose exec panel npm run db:migrate    # crear una migración tras editar el schema
docker compose exec panel npm run db:studio     # Prisma Studio (añade el puerto 5555 si lo usas)
docker compose exec panel npm run db:seed       # opiniones de ejemplo (solo dev)
docker compose exec panel npm run admin:create  # alta de una persona del panel de admin
docker compose down                           # detener (conserva los datos)
docker compose down -v                        # detener y borrar la base
```

También funciona como **devcontainer** (VS Code → "Reopen in Container"): usa el mismo `docker-compose.yml`.

## Compartir un link temporal (Cloudflare)

Con el stack levantado (`docker compose up -d`):

```bash
docker run -d --name hathor-tunnel --network hathor-frequency_default \
  cloudflare/cloudflared:latest tunnel --no-autoupdate --url http://web:5173
docker logs hathor-tunnel 2>&1 | grep trycloudflare.com   # muestra el link público
docker rm -f hathor-tunnel                                 # cerrar el link
```

- **Duración:** el link funciona mientras el equipo, Docker y el túnel sigan encendidos, y cambia cada vez que se reinicia el túnel.
- **Antes de publicar el sitio definitivo:** quitar `allowedHosts: ['.trycloudflare.com']` de `vite.config.ts`. Es solo para este modo de compartir.

## Sin Docker

Requisitos: Node 22+. La base es opcional para el frontend.

```bash
npm install
npm run dev:all   # web (http://localhost:5173, API :3000) + panel (http://localhost:5180/admin, API :3001)
npm run dev       # solo Vite (los formularios fallan sin la API)
npm run build     # chequeo de tipos + build a /dist
npm run preview   # sirve /dist
npm run lint      # oxlint
```

La API necesita la base: con tu `.env` listo, `docker compose up -d db` y luego `npm run db:deploy`.

## Estructura

```
docs/DESIGN.md           especificación visual exacta (desktop + móvil)
prisma/schema.prisma     modelos: ContactRequest, Booking, Review, BlockedSlot, AdminUser, AdminSession
prisma/seed.ts           opiniones de ejemplo para dev
prisma/migrations/       migraciones SQL versionadas
prisma.config.ts         configuración de Prisma 7 (DATABASE_URL, seed)
server/web/              API de la web (Hono): index.ts, routes/ (formularios y avisos en vivo)
server/panel/            API del panel: index.ts, auth.ts, routes/, lib/, scripts/create-admin.ts
server/shared/           lo común: db.ts, lib/, schemas.ts (zod), http.ts, routes/read.ts (lecturas públicas)
src/panel/               app del panel (index.html, main.tsx, App.tsx); vite.panel.config.ts
src/
  data/                  contenido editable: servicios, artistas, cifras, horarios, links
  pages/                 una página por ruta (/, /servicios, /artistas, /reservar, /contacto, /estudio)
  components/            Layout (nav fijo + ticker + footer), una carpeta por sección y shared/
  lib/calendar.ts        utilidades del calendario de Reservar
  lib/submit.ts          punto único de envío de formularios (fetch a /api)
  lib/useReviews.ts      opiniones publicadas · lib/useAvailability.ts  horarios ocupados
  styles/                tokens.css (:root) y base.css
docker/entrypoint.sh     arranque de los contenedores (el servicio migrate prepara todo)
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

## API y base de datos

Hay dos APIs (Hono + Prisma), una por servicio, y cada navegador llama a la suya en `/api`; en dev, Vite hace de proxy. Se avisan entre sí por PostgreSQL (`LISTEN/NOTIFY`).

| Endpoint | Para qué |
|---|---|
| `POST /api/contact` | guarda un contacto (`contact_requests`) |
| `POST /api/bookings` | guarda una reserva PENDING (`bookings`); 409 si el horario está ocupado o bloqueado |
| `GET /api/availability?month=YYYY-MM` | horarios ocupados y días cerrados del mes (sin datos personales) |
| `POST /api/reviews` · `GET /api/reviews` | guarda una opinión PENDING · lista las PUBLISHED |
| `/api/admin/*` | **solo en el panel** (en la web da 404): login/logout/me, summary, reservas, opiniones, contactos, bloqueos, contenido, sitio, usuarios, sesiones y registro de accesos (requiere sesión) |

- **Una sesión por horario**: un índice único parcial en `bookings (date, start_time)` para PENDING/CONFIRMED evita reservas dobles, aunque lleguen a la vez. Cancelar libera el horario.
- **Anti-spam**: campo honeypot (`website`) y límite de envíos por IP en memoria.
- **Panel del estudio**: en http://localhost:5180/admin, un servicio aparte de la web (Inicio/dashboard, Agenda con reservas y bloqueos, Opiniones, Contactos, Sitio, Contenido, Usuarios).
- **Usuario principal**: `ROOT_ADMIN_USERNAME` / `ROOT_ADMIN_PASSWORD` en `.env`. Al panel se entra con **usuario** ("jnunez"), no con correo. Al dar de alta a alguien se genera una contraseña temporal (cifrada con `APP_SECRET` de `.env` para que el principal la vea hasta que la persona ponga la suya en la bienvenida). La API lo crea al arrancar si no existe. Es el único que crea o quita admins en **/admin/usuarios**, y no se puede borrar.
- **Admin**: usuarios en `admin_users` (contraseña con scrypt), sesión por cookie httpOnly `hf_admin` (se cierra tras 12 h sin uso o a los 7 días). No hay registro público: `npm run admin:create`.
- **Login**: 10 intentos por IP cada 15 min y 5 fallidos seguidos bloquean la cuenta 15 min. Cada intento queda en el registro de accesos (Usuarios).
- **Producción**: `VITE_WEB_URL` y `VITE_PANEL_URL` en `.env` (p. ej. `https://hathorfrequency.mx` y `https://panel.hathorfrequency.mx`) antes de `npm run build`.
- El cliente Prisma se genera en `server/generated/prisma` (ignorado por git). Prisma nunca se importa desde `src/`.

## Visitas (Umami)

El dashboard del panel lee las visitas de Umami, que corre en el mismo `docker compose`.

1. Abre http://localhost:3100 y entra con **admin / umami**. Cambia la contraseña (Settings → Profile) y ponla también en `UMAMI_PASSWORD` de `.env`.
2. En Settings → Websites agrega el sitio. Copia su **Website ID** a `UMAMI_WEBSITE_ID` y `VITE_UMAMI_WEBSITE_ID` en `.env`.
3. `docker compose up -d web panel` para que tome los cambios.

El sitio público carga el script por `/umami` (proxy de Vite), así que también funciona por el túnel. El panel no se cuenta. Cada reserva enviada registra el evento `reserva-enviada`. Sin `VITE_UMAMI_WEBSITE_ID` no se carga nada.

## Contenido editable y medios

En **/admin/contenido** se editan servicios, paquetes, precios base, artistas, FAQs, Estudio y datos del sitio. Cada sección tiene su borrador y su **Publicar**, y la web abierta cambia al instante.

Las fotos y videos no se suben al panel: viven en un **disco aparte**.

1. En `.env`, pon `MEDIA_DIR=/ruta/del/hdd` (por defecto `./media`).
2. `docker compose up -d web panel`: Docker la monta en solo lectura y la API la sirve en `/media/...`.
3. En los formularios escribe la ruta (`/media/artistas/ralo/01.jpg`) o una URL externa (`https://…`). El panel revisa que exista y muestra la miniatura.
