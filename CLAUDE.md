# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado actual

La landing está construida (React + TypeScript + Vite) siguiendo `docs/DESIGN.md`, con Docker Compose (web + panel + PostgreSQL) y Prisma.

- Multipágina con `react-router`, definido en `src/App.tsx`:
  - `src/components/Layout/` contiene Nav sticky + `<Outlet>` + Ticker + Footer;
  - las páginas están en `src/pages/`;
  - rutas públicas: `/`, `/servicios`, `/artistas`, `/opiniones` (después de Artistas en el nav), `/reservar`, `/contacto`, `/faq` (FAQs en el nav, después de Reservar) y `/estudio` (tour de los espacios, `src/data/studio.ts`).
  - `/servicios` alterna dos vistas sin cambiar de ruta, Servicios (consola) y Paquetes (`src/data/packages.ts`), con la transición de cambio de frecuencia de `TuneTransition.tsx` (DESIGN §4.1).
  - En producción, el hosting debe redirigir toda ruta a `index.html` (SPA fallback).
- El panel lateral de detalle (paquetes y artistas) es `src/components/shared/Drawer.tsx`; la galería del artista (`Artists/MediaPanel.tsx`) se monta a su izquierda.
- Excepción al breakpoint único: el Nav cambia a hamburguesa por debajo de 1200px (con FAQs no cabe el nav completo). La barra lateral del panel `/admin` pasa arriba por debajo de 1024px.
- Componentes en `src/components/<Seccion>/` (un `.tsx` + `.css` por componente) y compartidos en `src/components/shared/`.
- Estilos: CSS plano con prefijo `hf-`, tokens en `src/styles/tokens.css`. Breakpoint único: `@media (max-width: 767px)`.
- Datos editables en `src/data/*.ts`, con tipos en `src/data/types.ts`.
- Horas: se guardan en 24 h ("15:00") y se muestran siempre en 12 h ("3:00 p. m.") con `formatTime` de `src/lib/time.ts`, en el sitio y en el panel.
- Horas de inicio de las sesiones: se editan en panel · Contenido · Horarios (`useContent('horarios').slots`; en el servidor, `bookingSlots()` de `server/shared/lib/slots.ts`). `timeSlots` de `src/data/booking.ts` es solo el valor inicial: no lo uses directo para validar ni para pintar horarios.
- Capa lúdica: platillo volador en todas las vistas (`src/components/Ufo/`), temporadas por mes y cumpleaños (`src/data/seasons.ts`, hook `useSeason`) y easter eggs; detalle en DESIGN.
- **Web y panel son dos servicios separados** (cambio del 2026-10-12): cada uno con su build, su servidor, su puerto y, en producción, su subdominio. Solo se conectan por PostgreSQL, así que uno sigue funcionando aunque el otro esté detenido (`docker compose stop panel`):
  - **web** (`docker compose` · `web`, :5173): el sitio público (`src/main.tsx`, `src/App.tsx`, `vite.config.ts`, build en `dist/web`) y su API `server/web/` (:3000): formularios, lecturas públicas y avisos en vivo. **No contiene nada del panel**: ni rutas `/admin` ni `/api/admin` (da 404). No importes `components/Admin` ni `adminApi` desde la web;
  - **panel** (`panel`, :5180, en `/admin`): app aparte (`src/panel/` con su `index.html`, `main.tsx` y `App.tsx`; `vite.panel.config.ts`, build en `dist/panel`) y su API `server/panel/` (:3001): sesión, `/api/admin/*` y el usuario principal. Monta también las lecturas públicas (`server/shared/routes/read.ts`: `/content`, `/site`, `/site/stats`, `/availability`);
  - lo común del servidor está en `server/shared/` (`db.ts`, `lib/`, `schemas.ts`, `content/schemas.ts`, `http.ts`, que crea la app y levanta cada servicio);
  - **avisos entre servicios**: `emitLive` / `emitAdmin` (`server/shared/lib/siteEvents.ts`) entregan al propio proceso y mandan a los demás con `NOTIFY hf_events`; cada servicio escucha con `LISTEN` (`listenEvents`, se reconecta solo y al volver pide recargar todo). Un aviso de más de 7.5 KB viaja como `refresh`;
  - **orígenes**: `src/lib/origins.ts` (`WEB_URL`, `PANEL_URL`; en producción `VITE_WEB_URL` / `VITE_PANEL_URL` en `.env`, en dev el mismo host con :5173 / :5180). Los iframes del panel (Sitio y Contenido) abren `WEB_URL` y se hablan por `postMessage` con origen explícito; la web solo deja que el panel la meta en un iframe (CSP `frame-ancestors`) y el panel no se deja meter en ninguno;
  - en dev, cada servicio corre `tsx watch` + Vite con proxy de `/api` y `/media` a su API (`npm run dev:web-all`, `dev:panel-all`; `dev:all` levanta los cuatro); los tipos de `server/` están en `tsconfig.server.json`, que forma parte de `npm run build` (que compila los dos frontends).
- La validación con zod está en `server/shared/schemas.ts` (reusa `timeSlots`, `bookingServices` y `contactTopics` de `src/data/`); la sesión del panel en `server/panel/auth.ts`.
- Formularios (Contacto, Reservar, Opiniones): todo envío pasa por `src/lib/submit.ts` (fetch + `SubmitError`). Llevan honeypot (`shared/Honeypot.tsx`) y hay rate limit por IP.
- Reservar: una sesión por horario. La garantía es el índice único parcial `bookings_active_slot_key`, hecho con SQL crudo en la migración `availability_admin` y que Prisma no modela; conservarlo. El calendario usa `useAvailability`.
- Opiniones: vienen de `GET /api/reviews` (`useReviews`), solo las PUBLISHED; sin consentimiento, el nombre sale como "Anónimo".
- Panel del estudio en `/admin` del servicio panel (DESIGN §7.4):
  - rutas `lazy` en `src/panel/App.tsx`, componentes en `src/components/Admin/`, cliente `src/lib/adminApi.ts` y contexto `src/lib/useAdmin.ts`;
  - la API está en `/api/admin/*` (solo en el servicio panel);
  - **seguridad del login** (sin 2FA por ahora, queda para después): 10 intentos por IP cada 15 min; 5 fallidos seguidos bloquean la cuenta 15 min (`failedLogins`, `lockedUntil`; una contraseña nueva del principal la desbloquea); con un correo sin cuenta también se compara una contraseña (no delata qué correos existen). La sesión se cierra tras 12 h sin uso o a los 7 días (`lastSeenAt`); cambiar la contraseña cierra las demás. El correo de un usuario nuevo lo genera la API (`staffEmail` de `src/data/staff.ts`: inicial del primer nombre + primer apellido + `@hathorfrequency.mx`, con 2, 3… si ya existe); el formulario solo lo muestra. El principal edita nombre y teléfono (`PATCH /api/admin/users/:id`); con `regenerateEmail` el correo se vuelve a armar (nunca el del principal) y se cierran las sesiones de esa persona. Cada intento queda en `admin_login_events` (90 días): el principal lo ve en Usuarios · Registro de accesos, y cada admin ve y cierra sus sesiones en Sesiones abiertas. `clientIp` usa la **última** IP de `X-Forwarded-For` (la que agrega nuestro proxy). La API del panel manda `X-Robots-Tag: noindex`, `X-Frame-Options: DENY` y CSP;
  - **usuario principal** (`ROOT_ADMIN_EMAIL` / `ROOT_ADMIN_PASSWORD` en `.env`, fuera de git): la API lo crea al arrancar si falta (`server/panel/lib/rootAdmin.ts`, `isRoot`). No se puede borrar y es el único que crea, cambia y quita admins en `/admin/usuarios` (`server/panel/routes/users.ts`); cualquier admin cambia su propia contraseña. `npm run admin:create` sigue sirviendo desde la terminal;
  - Agenda (`/admin/reservas`, `AdminAgenda.tsx`) junta reservas y bloqueos; el estudio también agenda sesiones ahí (`NewBookingModal.tsx`, `POST /api/admin/bookings`, correo opcional): en escritorio R2 "Pistas por día" y en móvil R1 "Agenda única" (`useMediaQuery`); `/admin/bloqueos` redirige ahí. El detalle de una reserva es `BookingDetail.tsx`;
  - el login (`AdminLogin.tsx`) lleva el alien con audífonos que reacciona al formulario (`LoginAlien.tsx`, A4/M1); Opiniones permite borrar (`DELETE /api/admin/reviews/:id`, con confirmación);
  - Inicio (`/admin`) es el dashboard D4 (`AdminDashboard.tsx`, `server/panel/routes/dashboard.ts`); el cobro de una reserva (`amountCents`, `paymentStatus`, `depositCents`) se captura en la ventana `ChargeModal.tsx`.
- Visitas: Umami en docker-compose (`umami` + `umami-db`, host :3100):
  - el sitio público lo carga desde `src/lib/analytics.ts`, solo si existe `VITE_UMAMI_WEBSITE_ID`, por el proxy `/umami` de Vite;
  - la API lee sus cifras en `server/panel/lib/umami.ts`;
  - el panel no se cuenta.
- Correos: fuera de alcance por ahora.
- Contenido editable (panel · Contenido):
  - las secciones son servicios, paquetes, precios, horarios, artistas, faq, estudio y sitio (`src/data/content.ts`, con los valores de `src/data/*` como contenido inicial);
  - **los componentes leen con `useContent('paquetes')`** (`src/lib/content.ts`), no importan directo de `src/data` para lo editable;
  - la validación por sección está en `server/shared/content/schemas.ts`;
  - la API es `GET /api/content` y `/api/admin/content/:key/*` (draft, publish, discard, history, restore);
  - en la BD están `ContentDraft` y `ContentVersion`; al publicar se manda el SSE `content` (`src/lib/live.ts` es el canal en vivo compartido);
  - los formularios se definen en `src/components/Admin/contentForms.ts`; al agregar un campo editable, agrégalo al tipo, al schema y al formulario.
- Tiempo real:
  - la web escucha `GET /api/site/events` (`site`, `content`, `stats`, `availability`, `reviews`; `src/lib/live.ts`);
  - el panel escucha `GET /api/admin/events` (`booking`, `contact`, `review`, `block`, `site`, `content`, `users`; `src/lib/useAdminLive.ts`, que se conecta en `AdminLayout`). Al agregar algo que cambie datos, emite el evento (`server/shared/lib/siteEvents.ts`).
- Calendarios del panel: `MonthPair.tsx` (dos meses), en la vista "Ver mes" de la Agenda móvil.
- Cifras: "Proyectos" = reservas `COMPLETED` (el admin las marca como terminadas en la agenda) y "Artistas" = artistas publicados sin los ocultos. Salen de `GET /api/site/stats` (`server/shared/lib/stats.ts`) y la web las lee con `useStats()`. El estado `COMPLETED` sigue ocupando su horario (índice `bookings_active_slot_key`).
- Medios: fotos y videos en un HDD aparte; en el panel se eligen con el buscador (`MediaPicker.tsx`, `GET /api/admin/media/list?dir=|q=`). Docker lo monta (`MEDIA_DIR` en `.env`) en `/app/media`, la API lo sirve en `/media/...` y la BD solo guarda rutas o URLs (`server/shared/lib/media.ts`).
- Módulos del sitio (panel · Sitio), para apagar cosas sin borrarlas:
  - registro en `src/data/modules.ts`, con páginas, secciones, elementos de listas y globales; **los ids publicados no se cambian**;
  - la web los lee con `src/lib/siteModules.ts` (`useModule`, `useModuleFilter`, `useVisibleLinks`) y `<Module id>` / `PageLink`; se cargan antes de pintar, en `main.tsx`;
  - `Button` con `to` se oculta solo si su página está apagada; una página apagada muestra "Próximamente" (`PageGate` en `pages.tsx`);
  - en la BD están `SiteDraft` (borrador) y `SiteVersion` (publicaciones);
  - la API es `GET /api/site` y `/api/admin/site/*`, y los formularios de páginas apagadas responden 403;
  - **en vivo**: al publicar, `GET /api/site/events` (SSE del servicio web, `server/shared/lib/siteEvents.ts`; el aviso llega del panel por `NOTIFY`) avisa a las páginas abiertas y cambian sin recargar. Si SSE no responde en 6 s (el túnel rápido de Cloudflare retiene el cuerpo del SSE), los mismos avisos llegan por long-polling (`GET /api/site/events/poll` y `/api/admin/events/poll`, feeds `siteFeed`/`adminFeed` de `siteEvents.ts`, cliente `src/lib/longPoll.ts`). Además se recarga todo al volver a la pestaña (`onRefresh`);
  - al agregar un bloque, un artista o una pregunta nuevos, dale su id y envuélvelo o fíltralo;
  - en `/admin/sitio` (`AdminSite.tsx`) la web va en un iframe con `?modo=edicion`, que solo se activa si el panel (`PANEL_ORIGIN`) contesta el saludo por `postMessage`; la vista previa de Contenido (`?modo=vista`) igual. `<Module>` pinta ahí el marco y el switch (`shared/EditFrame.tsx`), y `EditItem` el de cada elemento; el iframe y el panel se hablan por `postMessage` (mismo origen) y el panel guarda el borrador.
- Base de datos:
  - esquema en `prisma/schema.prisma`, con los modelos `ContactRequest` (con `handledAt`), `Booking`, `Review`, `BlockedSlot`, `AdminUser` y `AdminSession`;
  - seed de dev en `prisma/seed.ts`, con 3 opiniones provisionales;
  - migraciones en `prisma/migrations/`;
  - configuración en `prisma.config.ts` (Prisma 7: la URL va en la config, no en el schema);
  - el cliente se genera en `server/generated/prisma` y está en gitignore.
- El código de Prisma nunca va en `src/`, porque `src/` es el bundle del navegador. El código de servidor va en `/server`.

## Comandos

```bash
docker compose up --build   # todo: db (PostgreSQL 17, host :5440) + migrate + web (:5173) + panel (:5180/admin) + umami (:3100)
npm install                 # dependencias (sin Docker)
npm run dev:all             # web (Vite :5173 + API :3000) y panel (Vite :5180 + API :3001); `dev:web-all` / `dev:panel-all` por separado
npm run build               # tsc -b (chequeo de tipos) + build de la web (dist/web) y del panel (dist/panel)
npm run preview             # sirve /dist
npm run lint                # oxlint
npm run db:migrate          # prisma migrate dev (nueva migración tras editar el schema)
npm run db:deploy           # prisma migrate deploy
npm run db:generate         # prisma generate
npm run db:studio           # prisma studio
npm run db:seed             # opiniones de ejemplo (dev)
npm run admin:create        # alta/cambio de contraseña de un admin (interactivo)
```

Dentro de Docker, los comandos de Prisma se corren con `docker compose exec panel npm run db:migrate`. El único archivo de entorno es `.env` (fuera de git, sin `.env.example`); desde el host apunta a `localhost:5440`.

Para compartir un link temporal se usa un túnel rápido de Cloudflare: el contenedor `hathor-tunnel`; los comandos están en el README. **Es temporal:** `vite.config.ts` permite `allowedHosts: ['.trycloudflare.com']` solo para esto, y hay que quitarlo antes de la publicación definitiva.

No hay suite de tests. El servicio `migrate` corre una vez antes de `web` y `panel` (`docker/entrypoint.sh` con `HF_SETUP=1`): reinstala dependencias si cambió el lock, ejecuta `prisma generate` y `prisma migrate deploy`, y devuelve `server/` al dueño del repo.

## Qué construir

Landing page de **"Hathor Frequency"**, un sello discográfico / estudio de producción musical, video y live sessions para bandas emergentes en MX, con React + Vite.

> **El diseño exacto y aprobado de cada vista (desktop y móvil) está en [`docs/DESIGN.md`](docs/DESIGN.md).** Esa especificación prevalece sobre las descripciones de secciones de abajo (Servicios = "Consola de canales", Artistas = "Tracklist", Contacto = "Vinyl centrado", y se añade la sección Reservar = "Calendario"). Implementa cada componente tal como está ahí; pregunta antes de desviarte.

### Stack
- Docker (devcontainer)
- React + Vite con TypeScript
- PostgreSQL + Prisma (tablas vía migraciones), todo levantado con `docker compose`
- CSS plano con variables en `:root` y clases prefijadas `hf-` (sin frameworks de UI)
- Componentes separados por sección en `/src/components`
- Responsive (desktop primero, que funcione bien en móvil)

### Diseño elegido — Propuesta 11 "Combinada 08×10"

De las 11 propuestas exploradas en el canvas de diseño, se eligió la **11 (combinación de la 08 Art Decó CDMX y la 10 Vinyl Glow Nocturno)** como diseño general del sitio:

- **Paleta**: negro (`#000`) como fondo dominante, dorado `#F2C94C` como acento principal / glow y `#B8860B` como dorado secundario (usado en degradados), blanco `#fff` para texto sobre negro, grises de soporte `#bbb` / `#333` / `#444`.
- **Tipografía**: **Cinzel** (serif, display) para titulares y el logotipo; **Josefin Sans** (sans-serif) para cuerpo de texto, navegación y botones.
- **Titular de impacto**: la línea de cierre del H1 lleva degradado dorado (`linear-gradient(90deg, #F2C94C, #B8860B)` con `background-clip: text`) y un resplandor sutil (`text-shadow` dorado).
- **Motivo decorativo**: anillos concéntricos tipo "vinyl" en SVG, dorados, baja opacidad, como acento gráfico cerca del hero (reemplaza o convive con el waveform original).
- **Botones pill** (`border-radius: 40px`): primario relleno dorado con resplandor (`box-shadow: 0 0 22px rgba(242,201,76,0.35)`); secundario outline blanco.
- **Logo / wordmark** en dos líneas, usar en Nav y Footer: "HATHOR" (Cinzel, tracking amplio) sobre "Frequency" (Cinzel, más pequeño, tracking amplio).
- **Eslogan**: *"Un lugar pensado por músicos, para músicos."* — en cursiva dorada, como línea secundaria bajo el subtítulo del hero.

### Secciones (en este orden)

1. **Nav** — grid de 3 columnas: links a la izquierda (Servicios, Artistas), logo en dos líneas "HATHOR" / "Frequency" centrado (ver Diseño elegido), a la derecha (Estudio, Contacto) + botón pill "Reservar" en dorado outline. Borde inferior de 1px (`#333` sobre negro).

2. **Hero split** — dos columnas 50/50:
   - Izquierda: eyebrow "Sello discográfico independiente" con una línea corta antes; título grande "Donde la música toma forma." (~60px, line-height 0.95, Cinzel, cierre con degradado dorado); subtítulo "Producción musical, video y live sessions para bandas emergentes." seguido del eslogan en cursiva dorada; botones "Comenzar proyecto" (dorado relleno con glow) y "Ver portafolio" (outline); abajo el motivo de anillos de vinyl dorados.
   - Derecha (fondo negro): título de impacto en blanco con palabras apagadas en `#333` como contraste, más estadísticas (200+ Proyectos, 18 Artistas, 12 Años).

3. **Ticker animado** — banda negra con scroll horizontal infinito (CSS animation) que repite: Grabación · Mezcla · Masterización · Video · Live Sessions.

4. **Servicios** — grid asimétrico: columna de descripción a la izquierda + grid de servicios a la derecha. Cinco servicios: Grabación, Mezcla, Masterización, Video y Live Sessions (NO incluir Distribución). Cada uno con número, nombre y descripción corta.

5. **Artistas** — fila de cards con `aspect-ratio: 3/4`, cada una con un patrón geométrico SVG distinto de fondo (baja opacidad), nombre y género abajo:
   - Sofía M. — R&B · Soul
   - RALO — Hip-Hop · Trap
   - Luna K. — Pop · Indie

6. **Feature / Contacto** — sección dividida, con la mitad derecha en fondo negro: testimonio "— Sofía M., artista" y un input de email con botón "Contactar" (dorado).

7. **Footer** — logo (lockup "HATHOR" / "Frequency") a la izquierda, links (Instagram, Spotify, YouTube) al centro, "© 2026 Hathor Frequency · MX" a la derecha. Borde superior de 1px.

### Requisitos
- Datos (servicios, artistas, stats) en un archivo `/src/data` separado para editarlos fácil
- Hover sutiles en links y botones
- Accesibilidad básica: alt/aria en SVG decorativos, contraste correcto, HTML semántico
- Incluye README con instrucciones para correrlo (`npm install` / `npm run dev`)
