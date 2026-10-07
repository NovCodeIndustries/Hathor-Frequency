# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado actual

El repo está sin scaffolding: solo contiene `.gitignore` (plantilla Node), un `README.md` stub y este archivo. No existe `package.json`, `/src` ni devcontainer. La primera tarea real es crear el proyecto Vite y la estructura descrita en "Qué construir".

## Comandos

Aún no hay `package.json`, así que ningún comando funciona todavía. Tras el scaffolding (`npm create vite@latest . -- --template react`):

```bash
npm install      # dependencias
npm run dev      # servidor de desarrollo (Vite, http://localhost:5173)
npm run build    # build de producción a /dist
npm run preview  # sirve el build de /dist
```

No hay linter ni suite de tests configurados; no asumas que existen `npm test` o `npm run lint`. Si se añaden, documéntalos aquí.

Al correr dentro del devcontainer, el dev server necesita `--host` (o `server.host: true` en `vite.config.js`) para ser accesible desde fuera del contenedor.

## Qué construir

Landing page de **"Hathor Frequency"**, un sello discográfico / estudio de producción musical, video y live sessions para bandas emergentes en CDMX, con React + Vite.

### Stack
- Docker (devcontainer)
- React + Vite (JavaScript o TypeScript)
- CSS Modules o CSS plano con variables en `:root` (sin frameworks de UI)
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

7. **Footer** — logo (lockup "HATHOR" / "Frequency") a la izquierda, links (Instagram, Spotify, YouTube) al centro, "© 2025 Hathor Frequency · CDMX" a la derecha. Borde superior de 1px.

### Requisitos
- Datos (servicios, artistas, stats) en un archivo `/src/data` separado para editarlos fácil
- Hover sutiles en links y botones
- Accesibilidad básica: alt/aria en SVG decorativos, contraste correcto, HTML semántico
- Incluye README con instrucciones para correrlo (`npm install` / `npm run dev`)
