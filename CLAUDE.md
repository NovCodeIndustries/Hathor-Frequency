# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado actual

La landing está construida (React + TypeScript + Vite) siguiendo `docs/DESIGN.md`, con Docker Compose (app + PostgreSQL) y Prisma.

- Multipágina con `react-router`, definido en `src/App.tsx`:
  - `src/components/Layout/` contiene Nav sticky + `<Outlet>` + Ticker + Footer;
  - las páginas están en `src/pages/`;
  - rutas: `/`, `/servicios`, `/artistas`, `/opiniones` (después de Artistas en el nav), `/reservar`, `/contacto`, `/faq` (FAQs en el nav, después de Reservar) y `/estudio` (tour de los espacios, `src/data/studio.ts`).
  - `/servicios` alterna dos vistas sin cambiar de ruta, Servicios (consola) y Paquetes (`src/data/packages.ts`), con la transición de cambio de frecuencia de `TuneTransition.tsx` (DESIGN §4.1).
  - En producción, el hosting debe redirigir toda ruta a `index.html` (SPA fallback).
- El panel lateral de detalle (paquetes y artistas) es `src/components/shared/Drawer.tsx`; la galería del artista (`Artists/MediaPanel.tsx`) se monta a su izquierda.
- Excepción al breakpoint único: el Nav cambia a hamburguesa por debajo de 1200px (con FAQs no cabe el nav completo).
- Componentes en `src/components/<Seccion>/` (un `.tsx` + `.css` por componente) y compartidos en `src/components/shared/`.
- Estilos: CSS plano con prefijo `hf-`, tokens en `src/styles/tokens.css`. Breakpoint único: `@media (max-width: 767px)`.
- Datos editables en `src/data/*.ts`, con tipos en `src/data/types.ts`.
- Capa lúdica: platillo volador en todas las vistas (`src/components/Ufo/`), temporadas por mes y cumpleaños (`src/data/seasons.ts`, hook `useSeason`) y easter eggs; detalle en DESIGN.
- Formularios (Contacto, Reservar, Opiniones): todo envío pasa por `src/lib/submit.ts`, que hoy solo simula. **Aún no hay API.** La base de datos está preparada (Prisma), pero el frontend no la usa todavía.
- Base de datos:
  - esquema en `prisma/schema.prisma`, con los modelos `ContactRequest`, `Booking` y `Review`;
  - migraciones en `prisma/migrations/`;
  - configuración en `prisma.config.ts` (Prisma 7: la URL va en la config, no en el schema);
  - el cliente se genera en `server/generated/prisma` y está en gitignore.
- El código de Prisma nunca va en `src/`, porque `src/` es el bundle del navegador. El código de servidor va en `/server`.

## Comandos

```bash
docker compose up --build   # todo: db (PostgreSQL 17, host :5440) + app (Vite :5173); migra al arrancar
npm install                 # dependencias (sin Docker)
npm run dev                 # Vite en http://localhost:5173 (server.host: true ya configurado)
npm run build               # tsc -b (chequeo de tipos) + build a /dist
npm run preview             # sirve /dist
npm run lint                # oxlint
npm run db:migrate          # prisma migrate dev (nueva migración tras editar el schema)
npm run db:deploy           # prisma migrate deploy
npm run db:generate         # prisma generate
npm run db:studio           # prisma studio
```

Dentro de Docker, los comandos de Prisma se corren con `docker compose exec app npm run db:migrate`. Desde el host, `.env` (copia de `.env.example`) apunta a `localhost:5440`.

Para compartir un link temporal se usa un túnel rápido de Cloudflare: el contenedor `hathor-tunnel`; los comandos están en el README. **Es temporal:** `vite.config.ts` permite `allowedHosts: ['.trycloudflare.com']` solo para esto, y hay que quitarlo antes de la publicación definitiva.

No hay suite de tests. El arranque del contenedor `app` lo hace `docker/entrypoint.sh`: reinstala dependencias si cambió el lock, ejecuta `prisma generate` y `prisma migrate deploy`, y devuelve `server/` al dueño del repo.

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
