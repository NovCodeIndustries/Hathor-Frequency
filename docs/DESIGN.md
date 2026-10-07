# DESIGN.md — Especificación visual de Hathor Frequency

Especificación **exacta** de la landing de Hathor Frequency, aprobada el 2026-10-07. Es la referencia para construir `src/components`. Cada sección se implementa tal como está descrita aquí, en **desktop** y en **móvil**. No se reinterpreta ni se simplifica: si algo debe cambiar, se pregunta antes.

## Fuentes de verdad (canvas de diseño)

| Canvas | Contenido | URL |
|---|---|---|
| Landing final — desktop | 7 vistas a 1440 px | https://claude.ai/artifact/G5cyKNh5RUmoECMhWwTaDK |
| Landing final — móvil | 7 vistas a 390 px | https://claude.ai/artifact/Jz4ZGFXhuivA8NXm2AGmey |
| Exploración Servicios | 5 propuestas (se eligió la 03) | https://claude.ai/artifact/LQEiJ6gToqr3XS8w3owYRk |
| Exploración Contacto/Reservar | 5 + 5 propuestas (se eligieron C2 y R2) | https://claude.ai/artifact/SvgcDXZvw3vXd8JrsReCWt |

Cada vista es un artboard (`Main.dc.html`, `02-Ticker.dc.html` … `07-Footer.dc.html`) con nombres iguales en los dos canvas finales. Si hay duda sobre un valor, manda el artboard.

---

## 1. Fundamentos

### 1.1 Paleta (variables en `:root`)

```css
:root {
  --c-bg: #000;          /* fondo dominante */
  --c-bg-alt: #0b0b0b;   /* mitad izquierda del hero */
  --c-surface: #0a0a0a;  /* paneles (reservar), disco */
  --c-surface-2: #050505;/* tarjetas/canales de consola */
  --c-gold: #F2C94C;     /* acento principal, glow */
  --c-gold-2: #B8860B;   /* dorado secundario (degradados) */
  --c-text: #fff;
  --c-text-2: #bbb;      /* párrafos, labels */
  --c-text-3: #888;      /* labels terciarios (días de semana, dt) */
  --c-line: #333;        /* bordes, divisores, palabras apagadas */
  --c-line-2: #444;      /* bordes de inputs y botones secundarios */
  --c-line-3: #222;      /* divisores sutiles, pistas de fader */

  --grad-gold: linear-gradient(90deg, #F2C94C, #B8860B);
  --grad-gold-v: linear-gradient(180deg, #F2C94C, #B8860B); /* caps de fader */
  --glow-btn: 0 0 22px rgba(242,201,76,0.35);
  --glow-btn-hover: 0 0 34px rgba(242,201,76,0.55);
  --glow-text: 0 0 24px rgba(242,201,76,0.25);
  --glow-cap: 0 0 14px rgba(242,201,76,0.45);
  --glow-led: 0 0 10px #F2C94C;

  --radius-pill: 40px;
  --radius-card: 6px;

  --font-display: 'Cinzel', serif;
  --font-body: 'Josefin Sans', sans-serif;
}
```

Contraste: el texto de lectura usa `#fff` o `#bbb` sobre negro. `#333` solo se usa para palabras **decorativas grandes** (las palabras apagadas del hero) y para bordes. El dorado sobre negro funciona para texto de cualquier tamaño.

### 1.2 Tipografía

Google Fonts: `Cinzel:wght@400;600;700` y `Josefin+Sans:ital,wght@0,300;0,400;0,600;1,400`.

| Uso | Fuente | Desktop | Móvil | Otros |
|---|---|---|---|---|
| H1 hero | Cinzel 600 | 64px / lh 0.95 | 44px / lh 0.95 | cierre en degradado dorado |
| H2 de sección | Cinzel 600 | 52px / lh 1.02 (Artistas 48, Contacto 60 / lh 0.98) | 34px / lh 1.05 (Contacto 38 / lh 1.02) | segunda mitad en degradado dorado |
| Frase de impacto del hero | Cinzel 600 | 54px / lh 1.05 | 34px / lh 1.08 | |
| H3 de tarjeta | Cinzel 600 | 22px (consola), 28px (tracks) | 22px | |
| Eyebrow | Josefin 400 | 13px, tracking 0.3em, MAYÚSCULAS, dorado | 11–12px | precedido de una línea dorada de 36px (móvil 28px) × 1px |
| Párrafo | Josefin 300 | 18px / lh 1.6, #bbb | 16–17px | |
| Descripción corta | Josefin 400 | 14–15px / lh 1.55, #bbb | 15px | |
| Label de formulario | Josefin 400 | 12px, tracking 0.2em, MAYÚSCULAS, #bbb | igual | |
| Botón | Josefin 600 (primario) / 400 | 15px, tracking 0.08em, MAYÚSCULAS | igual | |
| Links del nav | Josefin 400 | 14px, tracking 0.2em, MAYÚSCULAS | — | |
| Eslogan | Josefin italic | 17–18px, dorado | 16px | "Un lugar pensado por músicos, para músicos." |

**Texto en degradado dorado** (cierre de H1/H2):
```css
background: var(--grad-gold);
-webkit-background-clip: text; background-clip: text; color: transparent;
text-shadow: 0 0 24px rgba(242,201,76,0.25); /* hero: 0 0 28px rgba(...,0.3) */
```

### 1.3 Componentes base reutilizables

- **Logo (wordmark)**: dos líneas, `line-height: 1`. "HATHOR" en Cinzel 700, tracking 0.4em. Debajo, "Frequency" en Cinzel 400, tracking 0.55em, `#bbb`, con 6px de separación arriba.
  - Tamaños: Nav desktop 26/12px · Nav móvil 20/10px (tracking 0.35/0.5em) · Footer 22/11px.
  - Si va centrado, añadir `padding-left` igual al tracking para compensar el último espacio.
  - Es un `<a href="#">` con `aria-label="Hathor Frequency, inicio"`.
- **Eyebrow**: flex con gap de 14px (móvil 12px). Una línea dorada de 36×1px y el texto. En Contacto lleva línea a ambos lados.
- **Botón primario (pill dorada)**: fondo `#F2C94C`, texto negro 600, `border-radius: 40px` y `box-shadow: var(--glow-btn)`. Alto 52–56px (en el hero 54px), padding horizontal de 32px.
  - Hover: `box-shadow: var(--glow-btn-hover)` y `translateY(-1px)`, con transición de .25s.
- **Botón secundario (outline blanco)**: `1px solid #fff`, texto blanco y la misma forma de pill. Hover: fondo blanco y texto negro.
- **Botón outline dorado** ("Reservar" del Nav): `1px solid #F2C94C`, texto dorado, 44px de alto, padding de 0 26px (móvil 0 16px). Hover: fondo dorado y texto negro.
- **Anillos de vinyl (SVG decorativo)**: círculos concéntricos con `stroke: #F2C94C` y opacidad baja (0.12–0.6). En algunos casos llevan un círculo central relleno dorado (opacidad 0.3–0.5) y un punto negro. Siempre con `aria-hidden="true"`.
- **Input subrayado**: fondo transparente, sin borde salvo `border-bottom: 1px solid #444`. Texto blanco de 17px, placeholder `#888`. En focus el borde pasa a `#F2C94C`.
- **Pill de horario / día seleccionable**: un `<button>` con `aria-pressed`. Estados en la sección 5.
- **Transiciones**: entre .2s y .25s en color, fondo, borde y sombra.
- **Focus visible**: `outline: 2px solid #F2C94C; outline-offset: 2–3px` en todos los controles.

### 1.4 Layout y breakpoints

- **Desktop** (diseño a 1440px): padding lateral de 80px y padding vertical de sección de 88–112px.
  - Implementar con contenedor fluido (`max-width: 1440px; margin: 0 auto`) y columnas en `fr`, no en px fijos.
- **Móvil** (diseño a 390px): padding lateral de 16px, padding vertical de sección de 48–64px y zonas táctiles de al menos 44px.
- **Breakpoint**: layout móvil por debajo de **768px** y layout desktop desde 768px. Entre 768 y 1200px se usa el layout desktop, fluido. Las versiones intermedias (tablet) no están diseñadas: si algo se rompe, consultar.
- **Orden de la página**: Nav+Hero → Ticker → Servicios → Artistas → Reservar → Contacto → Footer.
- **Anclas**: `#servicios`, `#artistas`, `#reservar`, `#contacto`, `#estudio` (el destino de `#estudio` está pendiente).

---

## 2. Vista 1 — Nav + Hero (`Main.dc.html`)

### Desktop (1440 × 900)
Contenedor de columna: un header de 96px y el hero ocupando el resto (804px).

**Header (`<header>`)**
- Altura 96px, padding 0 80px, `border-bottom: 1px solid #333`, fondo negro.
- Grid de 3 columnas iguales con `align-items: center`:
  1. **Izquierda**: `<nav>` con los links "Servicios" (#servicios) y "Artistas" (#artistas), gap de 40px, 14px, tracking 0.2em, mayúsculas, blancos. Hover en dorado.
  2. **Centro**: el logo (26/12px), centrado (`justify-self: center`).
  3. **Derecha** (`justify-self: end`), con gap de 40px: los links "Estudio" (#estudio) y "Contacto" (#contacto), más el botón outline dorado "Reservar" (#reservar).

**Hero (`<section aria-labelledby="hero-title">`)**: grid de 2 columnas iguales.
- **Columna izquierda**: fondo `#0b0b0b`, padding 88px 72px 72px 80px, flex en columna con gap de 28px, `overflow: hidden` y `position: relative`.
  1. Eyebrow: "Sello discográfico independiente".
  2. `<h1 id="hero-title">`: "Donde la música **toma forma.**" (64px, lh 0.95; "toma forma." en degradado dorado con text-shadow de 28px).
  3. Bloque con gap de 10px:
     - subtítulo "Producción musical, video y live sessions para bandas emergentes." (19px, lh 1.55, #bbb, 300, max-width 480px);
     - eslogan en cursiva dorada de 18px.
  4. Botones con gap de 16px y padding-top de 8px:
     - primario "Comenzar proyecto" (→ #reservar, 54px de alto);
     - secundario "Ver portafolio" (→ #artistas, 54px de alto).
  5. Anillos de vinyl en SVG de 420×420, `position: absolute; left: 300px; bottom: -230px; opacity: .45`:
     - 6 anillos con radios 205/180/155/130/105/80 y `stroke-opacity` de 0.6;
     - centro relleno de r=40 en dorado con opacidad 0.5;
     - punto negro central de r=4.
- **Columna derecha**: fondo `#000`, padding 88px 80px 72px 72px, `border-left: 1px solid #333`, flex en columna con `justify-content: space-between`.
  1. `<p>` de impacto (Cinzel 600, 54px, lh 1.05): "Grabamos. <span #333>Mezclamos.</span> Filmamos. <span #333>Masterizamos.</span> Lanzamos."
  2. `<dl>` en grid de 3 columnas con `border-top: 1px solid #333`. Cada celda va en `flex-direction: column-reverse` (el número arriba y la etiqueta abajo) con gap de 8px y padding-top de 28px. Las celdas 2 y 3 llevan `border-left: 1px solid #333` y padding-left de 28px.
     - `<dd>`: número en Cinzel de 48px, dorado.
     - `<dt>`: etiqueta de 13px, tracking 0.25em, mayúsculas, #bbb.
     - Datos: **200+ Proyectos · 18 Artistas · 12 Años**.

### Móvil (390 × ~1240)
**Header**
- Altura 72px, padding 0 16px, borde inferior #333, `position: relative; z-index: 2`.
- Contenido en flex con `space-between`:
  - Izquierda: el logo (20/10px).
  - Derecha, con gap de 8px:
    - el botón outline dorado "Reservar" (44px de alto, padding 0 16px, 13px, tracking 0.15em);
    - el **botón hamburguesa**, redondo, de 44×44px, `border: 1px solid #444`.
- Icono de la hamburguesa: 3 líneas blancas de 18px con stroke de 1.5. Al abrir el menú cambia a una X dorada.
- Atributos del botón: `aria-expanded`, `aria-controls="m-menu"` y `aria-label` que alterna entre "Abrir menú" y "Cerrar menú".

**Menú desplegado** (`<nav id="m-menu">`, solo visible cuando está abierto)
- Posición absoluta en `top: 72px`, a todo el ancho, fondo negro, borde inferior #333 y padding 16px 16px 32px.
- 4 links en filas de 60px: Servicios, Artistas, Estudio, Contacto.
  - Cada fila va en flex con `space-between`, Cinzel 24px y `border-bottom: 1px solid #222`.
  - A la derecha de cada fila, el índice "01".."04" en dorado de 14px (`aria-hidden`).
- Al final, el eslogan en cursiva dorada de 16px, con margin-top de 24px.
- Comportamiento: se cierra al elegir un link (en implementación real: también con Escape y al hacer clic fuera).

**Hero**: dos bloques apilados.
- **Bloque 1** (fondo `#0b0b0b`, padding 48px 16px 200px, gap 22px, overflow hidden):
  1. Eyebrow de 11px con tracking 0.25em y línea de 28px.
  2. H1 de 44px con lh 0.95.
  3. Subtítulo de 17px y eslogan de 16px, separados por un gap de 8px.
  4. Botones apilados **a todo el ancho**, de 52px de alto y con gap de 12px: primario y secundario, con el texto centrado.
  5. Anillos en SVG de 320px, `left: 35px; bottom: -150px; opacity: .45`.
- **Bloque 2** (fondo negro, `border-top: 1px solid #333`, padding 48px 16px 56px, gap 40px):
  - frase de impacto de 34px con lh 1.08;
  - `<dl>` en 3 columnas: números de 32px, etiquetas de 11px con tracking 0.2em, padding de celda 20px 0 0 14px y bordes izquierdos #333.

---

## 3. Vista 2 — Ticker (`02-Ticker.dc.html`)

### Desktop (1440 × 72)
- Banda de 72px de alto con `overflow: hidden`, bordes superior e inferior de `1px solid #333` y fondo negro.
- Atributos: `role="marquee"` y `aria-label="Grabación, Mezcla, Masterización, Video, Live Sessions"`.
- Pista interna (`aria-hidden`):
  - flex con gap de 40px, `white-space: nowrap`, Cinzel de 24px, tracking 0.12em y padding-left de 40px;
  - repite 4 veces la secuencia: Grabación ◆ Mezcla ◆ Masterización ◆ Video ◆ Live Sessions ◆ (los ◆ en dorado).
- Animación:
  ```css
  @keyframes hf-ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  .hf-track { animation: hf-ticker 28s linear infinite; }
  @media (prefers-reduced-motion: reduce) { .hf-track { animation: none; } }
  ```
  La pista debe contener la secuencia duplicada para que el bucle no se note.

### Móvil (390 × 56)
Igual que desktop, con estos cambios: 56px de alto, Cinzel de 17px, gap de 24px, padding-left de 24px y animación de **22s**.

---

## 4. Vista 3 — Servicios · "Consola de canales" (`03-Servicios.dc.html`, `id="servicios"`)

Datos (`src/data`): la descripción corta de cada uno de los 5 servicios. **No incluir Distribución.**

| CH | Servicio | Descripción | Cap del fader desktop (top) | Cap del fader móvil (left) | Ángulo de las perillas (x2,y2 en viewBox 34) |
|---|---|---|---|---|---|
| 01 | Grabación | Sala, microfonía y backline listos; en vivo o por pistas. | 30px | 78% | (8,8) · (26,9) |
| 02 | Mezcla | Balance, espacio y carácter sin perder la energía de la toma. | 70px | 55% | (17,4) · (7,12) |
| 03 | Masterización | Consistencia y pegada para streaming, radio y vinil. | 18px | 86% | (27,12) · (11,5) |
| 04 | Video | Videoclips con la misma intención que tu sonido. | 96px | 40% | (6,17) · (23,5) |
| 05 | Live Sessions | Tu show en vivo, audio y video, listo para publicar. | 48px | 68% | (28,20) · (9,7) |

### Desktop (1440 × 900)
- Sección con padding 96px 80px, flex en columna y gap de 56px.
- **Cabecera**: grid `7fr 5fr`, gap de 80px, `align-items: end`.
  - Izquierda, con gap de 20px:
    - eyebrow "Servicios";
    - H2 de 52px: "Cinco canales, **una sola mezcla.**".
  - Derecha: párrafo de 18px en #bbb: "Sube el fader de lo que necesitas: cada servicio funciona solo, pero suena mejor cuando pasan por la misma consola."
- **Consola**: grid de 5 columnas iguales con gap de 16px y `flex-grow: 1` (llena el alto restante).
- **Canal (`<article class="strip">`)**: `border: 1px solid #333`, radius de 6px, padding de 24px, fondo `#050505`, flex en columna con gap de 20px.
  1. Fila superior en `space-between`:
     - "CH 0X" en Cinzel de 14px, dorado, tracking 0.2em;
     - LED: círculo de 8px en dorado con `box-shadow: 0 0 10px #F2C94C` (`aria-hidden`).
  2. Perillas: 2 SVG de 34×34 con gap de 14px. Cada una es un círculo r=15 con relleno `#111` y stroke `#444`, más una línea dorada de 2px desde el centro (17,17) hasta el punto indicado en la tabla.
  3. Fader (`aria-hidden`):
     - contenedor de 170px de alto, `border-left: 1px dashed #333` y margin-left de 17px;
     - pista: span absoluto de 3px de ancho, fondo `#222`, `left: -2px`, de arriba abajo;
     - cap: 36×14px, radius de 2px, fondo `var(--grad-gold-v)`, `box-shadow: var(--glow-cap)` y `left: -18px`, con el `top` de la tabla.
  4. Bloque inferior (`margin-top: auto`, gap de 10px):
     - `<h3>` en Cinzel de 22px;
     - descripción de 14px con lh 1.55, #bbb.
- **Hover del canal**: borde `#B8860B`, `box-shadow: 0 0 28px rgba(242,201,76,0.12)` y el cap pasa a `0 0 22px rgba(242,201,76,0.7)`.

### Móvil (390 × ~1420)
- Padding 56px 16px y gap de 32px.
- **Cabecera** apilada con gap de 16px: eyebrow de 12px, H2 de 34px y párrafo de 16px.
- Los canales pasan a ser **tarjetas apiladas a todo el ancho** (gap de 12px). Cada tarjeta tiene padding de 20px, gap de 16px, mismo borde, radius y fondo que en desktop.
  1. Fila superior en flex con gap de 12px: "CH 0X" de 13px, el LED y las dos perillas de 26px empujadas a la derecha (`margin-left: auto`, gap de 8px).
  2. **Fader horizontal**:
     - contenedor de 30px de alto con `border-bottom: 1px dashed #333`;
     - pista de 3px de alto, `#222`, a todo el ancho, en `top: 14px`;
     - cap **vertical** de 14×30px con degradado horizontal dorado y glow, en el `left` de la tabla.
  3. `<h3>` de 22px y descripción de 15px con lh 1.55.

---

## 5. Vista 4 — Artistas · "Tracklist" (`04-Artistas.dc.html`, `id="artistas"`)

Datos (`src/data`):

| Código | Lado | Nombre | Género | Patrón de la miniatura (SVG, viewBox 72) |
|---|---|---|---|---|
| A1 | A | Sofía M. | R&B · Soul | 4 círculos concéntricos (r 30/22/14/6) |
| A2 | A | RALO | Hip-Hop · Trap | 8 diagonales paralelas |
| B1 | B | Luna K. | Pop · Indie | 3 triángulos anidados |
| B2 | B | Tu banda (CTA, texto dorado) | "Reserva tu sesión" → #reservar | marco con borde punteado (`stroke-dasharray 4 4`) y un "+" en el centro |

Las miniaturas tienen fondo `#0a0a0a`, borde `#333` y trazos dorados con `stroke-opacity` de 0.5 (en B2, 0.7).

**Disco** (SVG con viewBox 440 y `role="img"`, `aria-label="Disco de vinil con la etiqueta de Hathor Frequency"`):
- base: círculo r=216 con relleno `#0a0a0a` y stroke `#333`;
- surcos: 9 círculos de r=200 a 104 (cada 12) en dorado con `stroke-opacity` de 0.18;
- reflejo: arco `M220 20 A200 200 0 0 1 400 140` en dorado con opacidad 0.5 y 2px de grosor;
- etiqueta: círculo r=80 con degradado dorado en diagonal;
- textos de la etiqueta en negro: "HATHOR" en Cinzel 700 de 22px con letter-spacing 5, y "FREQUENCY" de 11px con letter-spacing 4;
- eje: círculo negro r=5.

### Desktop (1440 × 900)
- Grid `5fr 7fr`, gap de 96px, padding 96px 80px, `align-items: center`.
- **Izquierda** (gap de 40px):
  - eyebrow "Artistas" y H2 de 48px: "Las voces **del catálogo.**";
  - disco de 440px.
- **Derecha** (gap de 44px):
  - párrafo de 18px en #bbb (max-width 560px): "Bandas y solistas que grabaron, mezclaron y lanzaron su música con nosotros."
  - Dos grupos, "Lado A" y "Lado B". La cabecera de cada grupo va en `space-between` con `border-bottom: 1px solid #F2C94C`, texto dorado de 13px, tracking 0.3em y mayúsculas; a la derecha lleva "33⅓" (Lado A) o "45" (Lado B) en Cinzel.
- **Fila de track** (`<a class="track">`): grid `48px 72px 1fr auto 24px`, gap de 24px, padding 20px 0, `border-bottom: 1px solid #333`. Contiene, en orden:
  1. código en Cinzel de 15px, dorado;
  2. miniatura de 72px;
  3. nombre en Cinzel 600 de 28px;
  4. género de 15px con tracking 0.15em, mayúsculas, #bbb;
  5. flecha "→" en #bbb.
- **Hover de la fila**: `padding-left: 16px`, fondo `linear-gradient(90deg, rgba(242,201,76,0.08), transparent)` y la flecha en dorado con `translateX(4px)` (transición de .25s).

### Móvil (390 × ~1240)
- Padding 56px 16px, apilado con gap de 32px. Orden:
  1. eyebrow y H2 de 34px;
  2. **disco de 280px centrado**: 7 surcos (r=200 a 104 cada 16) y textos de la etiqueta de 24/12px;
  3. párrafo de 16px;
  4. Lado A y Lado B (cabeceras de 12px).
- **Fila de track**: grid `28px 56px 1fr 16px`, gap de 14px, padding 16px 0. Contiene:
  1. código de 14px;
  2. miniatura de 56px;
  3. **nombre (22px) encima del género (13px)**, apilados con gap de 4px;
  4. flecha.
- En táctil, `:active` aplica el fondo dorado al 8%.

---

## 6. Vista 5 — Reservar · "Calendario" (`05-Reservar.dc.html`, `id="reservar"`) — interactiva

**Estado**: `selectedDay` (inicial 17) y `selectedSlot` (inicial 2, que corresponde a las 15:00).
- Mes de ejemplo: **noviembre de 2026**. La semana empieza en lunes; el 1 de noviembre cae en domingo, así que hay 6 celdas vacías al inicio.
- En la implementación real el mes debe ser dinámico, con navegación funcional y la disponibilidad tomada de su fuente.
- Horarios (`src/data`): `10:00, 12:00, 15:00, 17:00, 19:00, 21:00`.
- Servicios del select: Grabación, Mezcla, Masterización, Video, Live Sessions.

**Estados de un día:**
- Normal: borde `#222`, fondo transparente, texto blanco, Cinzel.
- Hover: borde dorado.
- Seleccionado: fondo `#F2C94C`, texto negro, borde dorado y `box-shadow: 0 0 22px rgba(242,201,76,0.4)` (móvil 18px). Lleva `aria-pressed="true"`.
- Cada día lleva `aria-label`, por ejemplo "Martes 17 de noviembre".

**Estados de un horario:**
- Normal: borde `#444`, texto blanco.
- Seleccionado: borde dorado, fondo `rgba(242,201,76,0.12)` y texto dorado.

**Textos dinámicos:**
- Fecha mostrada: "{Díasemana} {d} de noviembre", con `aria-live="polite"`.
- Botón: "Reservar {HH:MM} h".

### Desktop (1440 × 1000)
- Grid `7fr 5fr`, gap de 64px, padding 88px 80px.
- **Izquierda** (gap de 36px):
  - eyebrow "Reservar" y H2 de 52px: "Elige el día **que vas a grabar.**";
  - tarjeta del calendario: `border: 1px solid #333`, radius de 6px, padding de 32px, gap de 20px.
    1. Navegación del mes en `space-between`:
       - botones redondos de 44px con borde `#444` y chevron SVG de 16px, con `aria-label` "Mes anterior" y "Mes siguiente"; hover con borde dorado;
       - "Noviembre 2026" en Cinzel de 24px, tracking 0.08em.
    2. Cabecera de la semana (`aria-hidden`): grid de 7 columnas con gap de 8px, texto de 12px, tracking 0.2em, mayúsculas, #888, centrado: Lun Mar Mié Jue Vie Sáb Dom.
    3. Días: grid de 7 columnas con gap de 8px; botones de 56px de alto, radius de 6px y Cinzel de 18px.
- **Derecha (`<aside aria-label="Detalle de la sesión">`)**: fondo `#0a0a0a`, borde `#333`, radius de 6px, padding 48px 40px, gap de 28px, overflow hidden.
  - Anillos decorativos de 360px en la esquina inferior derecha (`right/bottom: -160px`, opacidad 0.3).
  1. "Tu sesión" (13px, tracking 0.3em, dorado) y debajo la fecha en Cinzel de 30px.
  2. Label "Servicio" y `<select>` en forma de pill: 52px de alto, fondo negro, borde `#444` y radius de 40px.
  3. `<fieldset>` con `<legend>` "Hora de inicio" y los horarios en grid de 3 columnas con gap de 10px (pills de 48px).
  4. Nota de 15px en #bbb: "Te confirmamos disponibilidad por correo en menos de [TIEMPO DE RESPUESTA]."
  5. Botón primario a todo el ancho, de 56px de alto y con `margin-top: auto`: "Reservar 15:00 h".

### Móvil (390 × ~1380)
- Apilado, con padding 56px 16px y gap de 28px:
  1. eyebrow y H2 de 34px;
  2. tarjeta del calendario a todo el ancho (padding 16px 12px, gap de 14px):
     - "Noviembre 2026" en Cinzel de 19px, con las mismas flechas de 44px;
     - cabecera de la semana abreviada (**Lu Ma Mi Ju Vi Sá Do**) a 11px y tracking 0.1em;
     - días: grid de 7 columnas con **gap de 4px**, botones de **44px** de alto, padding 0 y Cinzel de 16px;
  3. panel de la sesión (padding 24px 16px, gap de 22px, anillos de 240px arriba a la derecha):
     - fecha en Cinzel de 24px;
     - select de 52px;
     - horarios en 3 columnas con gap de 8px y 48px de alto;
     - nota de 14px;
     - botón a todo el ancho de 56px.

---

## 7. Vista 6 — Contacto · "Vinyl centrado" (`06-Contacto.dc.html`, `id="contacto"`)

### Desktop (1440 × 900)
- Sección centrada (flex en columna, centrado en ambos ejes y `text-align: center`), con gap de 28px, padding de 80px y overflow hidden.
- **Fondo**: SVG de 1100×1100 en `left: 170px; top: -100px` con:
  - 6 anillos de r=540 a 340 (cada 40) con `stroke-opacity` de 0.12;
  - un anillo r=300 con opacidad 0.35;
  - el arco `M550 10 A540 540 0 0 1 1010 270` con opacidad 0.6 y 2px de grosor.
- Contenido, todo con `position: relative` encima del fondo:
  1. Eyebrow "Contacto" con líneas de 36px **a ambos lados**.
  2. H2 de 60px con lh 0.98 y max-width de 820px: "¿Tienes una canción **esperando salir?**" (degradado con glow de 0.3).
  3. Párrafo de 18px en #bbb: "Escríbenos y la ponemos a girar."
  4. Formulario de 560px de ancho, con padding-top de 8px. El label "Tu correo" queda oculto visualmente (clase sr-only). Todo va dentro de **una sola pill**:
     - contenedor en flex con gap de 8px, padding 6px 6px 6px 28px, `border: 1px solid #444`, radius de 40px y fondo `rgba(0,0,0,0.8)`;
     - `input type="email"`: placeholder "Tu correo", 48px de alto, sin borde, 17px;
     - botón primario "Contactar" de 48px de alto y padding 0 28px.
     - `:focus-within` del contenedor: `box-shadow: 0 0 0 1px #F2C94C, 0 0 30px rgba(242,201,76,0.25)`.
  5. `<figure>` con margin-top de 32px, max-width de 620px y gap de 12px:
     - `<blockquote>` en Cinzel de 20px, lh 1.45: "“Llegamos con un demo grabado en el celular y salimos con un disco que suena como siempre lo imaginamos.”" (**texto provisional**, reemplazar por el testimonio real);
     - `<figcaption>`: "— Sofía M., artista", 14px, tracking 0.2em, mayúsculas, dorado.
  6. `<nav aria-label="Redes">`: Instagram, Spotify y YouTube, con gap de 32px, 14px, tracking 0.2em, mayúsculas, #bbb y hover en dorado.

### Móvil (390 × ~880)
- Padding 64px 16px y gap de 24px.
- Anillos de unos 640px con `left: -125px; top: 40px` (4 anillos y el arco).
- Contenido:
  - eyebrow con líneas de 24px;
  - H2 de 38px con lh 1.02;
  - párrafo de 16px.
- **Cambio respecto a desktop**: la pill se divide en dos piezas apiladas a todo el ancho, con gap de 10px:
  - `input` en forma de pill propia: 54px de alto, borde `#444`, radius de 40px, padding 0 24px y texto centrado; en focus, borde dorado y glow suave;
  - botón "Contactar" de 54px, a todo el ancho.
- Testimonio en Cinzel de 18px y figcaption de 13px.
- Redes como zonas táctiles de 44px (padding 0 10px), 13px, tracking 0.15em.

---

## 8. Vista 7 — Footer (`07-Footer.dc.html`)

### Desktop (1440 × 140)
- `<footer>` de 140px de alto, padding 0 80px y `border-top: 1px solid #333`, en grid de 3 columnas con `align-items: center`:
  1. **Izquierda**: el logo (22/11px), alineado a la izquierda.
  2. **Centro**: `<nav aria-label="Redes sociales">` con Instagram ◆ Spotify ◆ YouTube.
     - Links de 14px, tracking 0.2em, mayúsculas, #bbb, con hover en dorado.
     - Los ◆ van en dorado de 8px, con `aria-hidden`.
     - Gap de 28px.
  3. **Derecha**: "© 2025 Hathor Frequency · CDMX", 14px, tracking 0.08em, #bbb.

### Móvil (390 × ~280)
- Todo apilado y centrado, con padding 40px 16px y gap de 24px:
  1. el logo, centrado;
  2. las redes como zonas táctiles de 44px (13px, tracking 0.15em), con los ◆ de 7px;
  3. el © de 13px, con padding-top de 16px y `border-top: 1px solid #222` a todo el ancho.

---

## 9. Accesibilidad (obligatoria)

- HTML semántico: `header`, `nav` con `aria-label`, `section` con `aria-labelledby`, `article` en los canales, `dl` en las cifras, `figure`/`blockquote`/`figcaption` en el testimonio, `fieldset`/`legend` en los horarios y `aside` en el panel de la sesión.
- Un solo `h1` (en el hero). Cada sección lleva su `h2` y los elementos internos `h3`.
- Los SVG decorativos llevan `aria-hidden="true"`. El disco de Artistas lleva `role="img"` y un `aria-label`.
- Todos los inputs tienen `<label>`; cuando el label se oculta visualmente, se usa una clase sr-only.
- Los botones de selección (días, horarios, hamburguesa) usan `aria-pressed` o `aria-expanded`. Los botones que solo tienen icono llevan `aria-label`.
- El ticker respeta `prefers-reduced-motion`.
- Zonas táctiles de al menos 44px en móvil y focus visible dorado en todos los controles.

## 10. Datos (`/src/data`)

- `services.js`: `{ ch, name, description, faderDesktopTop, faderMobileLeft, knobs }` × 5.
- `artists.js`: `{ code, side, name, genre, pattern }`, más la fila CTA "Tu banda".
- `stats.js`: `[{ value: '200+', label: 'Proyectos' }, { value: '18', label: 'Artistas' }, { value: '12', label: 'Años' }]`.
- `booking.js`: horarios, servicios del select y texto de respuesta.
- `site.js`: links del nav, redes sociales, eslogan, testimonio y copyright.

## 11. Mapa de componentes sugerido (`/src/components`)

`Nav` (incluye `MobileMenu`) · `Hero` · `Ticker` · `Services` (+ `ChannelStrip`) · `Artists` (+ `Vinyl`, `TrackRow`, `ArtistPattern`) · `Booking` (+ `Calendar`, `SessionPanel`) · `Contact` · `Footer`, más componentes compartidos: `Logo`, `Eyebrow`, `Button` (variantes primary / ghost / outline-gold), `VinylRings` y `GoldText`.

## 12. Pendientes conocidos

- **Testimonio**: el texto de Sofía M. es provisional.
- **Placeholder**: falta reemplazar `[TIEMPO DE RESPUESTA]`.
- **Navegación**: el link "Estudio" (`#estudio`) no tiene sección de destino.
- **Envíos**: falta definir a dónde van el formulario de contacto y la reserva (backend o servicio).
- **Calendario**: la disponibilidad y la navegación entre meses son estáticas en el diseño.
- **Redes**: Contacto repite los links que también aparecen en el Footer (decisión abierta).
- **Tablet**: no hay diseño para 768–1200px; se usa el layout desktop fluido.
