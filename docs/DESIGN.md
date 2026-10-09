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
- **Favicon** (`public/favicon.svg`, propuesta **F5 · Onda** del canvas https://claude.ai/artifact/UYCM6kBZqkC7cC5eiNYAHH): un círculo negro con aro dorado en degradado (3px), ejes tenues al 18% y una onda senoidal dorada de 3.6px con remates redondos. Es un SVG vectorial, sin fuentes.
- **Focus visible**: `outline: 2px solid #F2C94C; outline-offset: 2–3px` en todos los controles.

### 1.4 Layout y breakpoints

- **Desktop** (diseño a 1440px): padding lateral de 80px y padding vertical de sección de 88–112px.
  - Implementar con contenedor fluido (`max-width: 1440px; margin: 0 auto`) y columnas en `fr`, no en px fijos.
- **Móvil** (diseño a 390px): padding lateral de 16px, padding vertical de sección de 48–64px y zonas táctiles de al menos 44px.
- **Breakpoint**: layout móvil por debajo de **768px** y layout desktop desde 768px. Entre 768 y 1200px se usa el layout desktop, fluido. Las versiones intermedias (tablet) no están diseñadas: si algo se rompe, consultar.
- **Estructura multipágina** (cambio del 2026-10-07): cada vista es una página propia con su ruta. Todas comparten el mismo layout:
  - **Nav** fijo arriba y siempre visible (`position: sticky; top: 0`), con el mismo diseño de siempre;
  - el contenido de la página;
  - el **Ticker** encima del Footer;
  - el **Footer**.
- **Rutas**:
  - `/` → Hero;
  - `/servicios`, `/artistas`, `/reservar`, `/contacto`;
  - `/estudio` → página provisional "Muy pronto", porque Estudio aún no tiene diseño;
  - `/faq` → Preguntas frecuentes (§7.1); en el nav aparece como **FAQs**, después del botón Reservar.
- **Nav con FAQs** (cambio del 2026-10-09):
  - ≥ 1440px: el diseño original con FAQs al final de la derecha (link igual que los demás).
  - 1200–1439px: los links bajan a 13px, tracking 0.12em y gap de 20px; el botón usa padding de 0 20px.
  - < 1200px: ya no caben los 4 elementos de la derecha junto al logo centrado, así que se usa el nav móvil (logo a la izquierda, Reservar y hamburguesa). El menú desplegado lista Servicios, Artistas, Estudio, Contacto y FAQs (01–05), con padding lateral `--pad-x`.
- **Títulos**: el título principal de cada página es su `h1`.
- **Link activo**: el link del nav de la página actual se muestra en dorado (`aria-current="page"`).

---

## 1.5 Bienvenida — "Sintonizando" (`Welcome.tsx`, estilo **B3**)

Canvas de propuestas: https://claude.ai/artifact/Da2u8EXGAkktnoC22uBh7y

- **Cuándo aparece:** **siempre**, cada vez que se carga o recarga el sitio. Al navegar entre páginas no vuelve a salir, porque el layout no se recarga.
- **Comportamiento:**
  - la barra va de 0 a 100 % en **4 s** y luego entra sola al sitio con un fundido de 0.6 s;
  - "Entrar ahora →" o Escape la saltan en cualquier momento;
  - mientras está abierta, la página de fondo no hace scroll.
- **Contenedor:** pantalla completa (`position: fixed`, z-index 200, fondo #000), flex en columna con `space-between` y padding 72px 120px 64px.
- **Dial (arriba):**
  - escala de 64px de alto con borde inferior #333 y 41 marcas: menores de 10px (#444), medias de 18px y mayores de 32px (#bbb);
  - la marca "HF" está al 60 %, mide 48px y es dorada;
  - una aguja dorada de 2px con glow entra desde la izquierda, se pasa un poco y se asienta en "HF" (2.6 s);
  - etiquetas en Cinzel 14px: 88 · 92 · 96 · **HF** · 104 · 108.
- **Nombre (centro):**
  - LED + "Estás sintonizando" (13px, tracking 0.3em, dorado);
  - "HATHOR" en Cinzel 700, `clamp(44px, 8.4vw, 120px)`, tracking 0.3em;
  - "Frequency" en Cinzel 400, `clamp(16px, 2.4vw, 34px)`, tracking 0.55em, en degradado dorado;
  - el eslogan en cursiva de 18px, #bbb.
- **Pie:**
  - ecualizador de 60 barras con degradado dorado vertical, alto de 72px y envolvente en campana; cada barra sube y baja en 1.2 s con desfases;
  - fila de progreso: "Sintonizando…" (12px, #888), una pista de 2px (#222) con relleno dorado, el porcentaje en Cinzel dorado (`role="progressbar"`) y el botón "Entrar ahora →".
- **Móvil:**
  - padding 40px 16px 32px;
  - dial de 48px;
  - la mitad de las barras (30) en 56px de alto;
  - fila de progreso partida en dos: arriba la etiqueta y el %, debajo la pista a todo el ancho y el botón centrado a todo el ancho (44px).
- **Movimiento:** con reduced-motion, la aguja y el ecualizador quedan quietos y no hay fundidos.

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

**Faders interactivos** (cambio del 2026-10-07):
- **Nivel:** cada fader tiene un nivel de 0 a 100, que vive en `src/data/services.ts` como `level`. Los niveles iniciales son 80 / 55 / 87 / 39 / 69, equivalentes a las posiciones de la tabla.
- **Posición del cap:**
  - en desktop, `top = (100 − nivel) × (170 − 14) / 100` px;
  - en móvil, `left = nivel × (100% − 14px) / 100`.
- **Control:**
  - se arrastra con mouse o touch, y un clic en la pista salta a ese punto;
  - con teclado: ↑/→ y ↓/← mueven ±1 (con Shift, ±10), RePág/AvPág ±10, Inicio = 0 y Fin = 100.
- **Accesibilidad:** cada fader es un `role="slider"` con `aria-label` "Nivel de {servicio}", `aria-valuenow` y `aria-orientation` (vertical en desktop, horizontal en móvil). El foco visible es un contorno dorado en el cap.
- **Arrastre:** mientras se arrastra, el cap usa el glow de hover y el cursor `grabbing`.
- **Touch:** en móvil la pista usa `touch-action: pan-y`, para que se pueda seguir haciendo scroll vertical.
- **LED:** su opacidad sigue al nivel (`0.25 + nivel × 0.0075`): se atenúa al bajar el fader.

**Easter egg "Contacto establecido"** (`AlienSignal.tsx`, estilo **A3 · Osciloscopio** del canvas https://claude.ai/artifact/Y1xkrireKBrrmBSM7iswed):
- **Combinación:** se dispara cuando los faders quedan en CH1 abajo (≤ 15) · CH2 mitad (40–60) · CH3 arriba (≥ 85) · CH4 mitad · CH5 abajo. Con cualquier otra posición no pasa nada.
- **Repetición:** se activa solo al entrar en la combinación. Para volver a verlo hay que salir de ella y volver a formarla.
- **Contenedor:** pantalla completa (`position: fixed`, z-index 100, fondo #000), flex en columna centrada con gap de 40px y padding 56px 80px.
- **Pantalla del osciloscopio:**
  - ancho `min(1040px, 100%)`, proporción 2:1 (como máximo 58vh de alto), borde #333, radius de 6px, fondo #050505 y glow interior dorado;
  - cuadrícula de 52px al 8%, más los ejes centrales al 18%;
  - onda punteada (6/6) que se desplaza;
  - barrido dorado que cruza la pantalla cada 2.4s;
  - lecturas en las esquinas (12px, tracking 0.2em): "CH 01–05", "Freq 432 Hz", LED + "Señal 100%" y "Origen · desconocido".
- **Rostro:** relleno con un patrón de ondas senoidales doradas, contorno dorado de 2px y glow. Los ojos son negros con borde dorado y pupilas doradas que parpadean. Ocupa el 69% del alto de la pantalla, centrado.
- **Texto:** grid de 2 columnas con gap de 64px.
  - Izquierda: H2 Cinzel 56px "Contacto **establecido.**", con la segunda palabra en degradado dorado.
  - Derecha: log de 14px en mayúsculas, tracking 0.15em, con "›" dorados:
    - "Decodificando la mezcla… 100%";
    - "Patrón 1·2·3·2·1 reconocido";
    - "Mensaje: “Suena increíble desde aquí.”" (en blanco);
    - la nota "Se cierra en 10 s · clic o Esc para cerrar" (12px, #888).
- **Cuenta regresiva:** barra dorada de 3px abajo que se vacía en 10s.
- **Móvil:** pantalla en proporción 4:5 (como máximo 52vh), rostro al 62%, lecturas de 10px (sin "Freq"), texto apilado y H2 de 34px.
- **Cierre:** se quita sola a los **10 s**, o antes con clic o Escape.
- **Movimiento:** con reduced-motion se desactivan las animaciones y el barrido.

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

### 4.1 Paquetes (misma página, estilo **P6 · Combinada** del canvas https://claude.ai/artifact/KQB17eYb4oPVx9379izoru)

Cambio del 2026-10-08. `/servicios` tiene dos vistas, Servicios (la consola) y Paquetes, que se alternan sin cambiar de ruta.
- **Interruptor** (botones de P1), en la columna derecha del encabezado, encima del párrafo, alineado a la derecha:
  - pill con borde `#444` y padding de 4px; dos botones de 44px de alto ("Servicios" / "Paquetes"), 13px, 600, tracking 0.15em, mayúsculas;
  - el activo va relleno dorado con texto negro (`aria-pressed="true"`), el otro transparente.
  - En móvil ocupa todo el ancho (botones `flex: 1`) y el párrafo va alineado a la izquierda.
- **Encabezado:** la vista Paquetes cambia el eyebrow a "Paquetes", el h1 a "Elige tu disco, *nosotros lo prensamos.*" (cierre dorado) y el párrafo a `packagesIntro`.
- **Transición** (ondas de P2, `WaveTransition.tsx`):
  - overlay fijo a pantalla completa (z-index 90, sobre el nav), con 8 anillos concéntricos centrados en la pantalla, de `150vmax` a `38vmax` (−16vmax cada uno);
  - los pares van rellenos de dorado (degradado #F2C94C → #B8860B, glow) y los impares en negro; el más grande es dorado liso;
  - **cubrir**: cada anillo escala de 0 a 1 en 1.05s (`cubic-bezier(.65,0,.35,1)`), con 45ms de retraso entre anillos; a los 0.6s aparece al centro el nombre de la vista destino (Cinzel, dorado, tracking 0.3em);
  - a los 1350ms, con la página cubierta, se cambia la vista y se vuelve arriba del todo;
  - **recoger**: los anillos vuelven a 0 en 0.9s, del más pequeño al más grande (40ms entre anillos), y se quita el overlay a los 2550ms.
  - Con `prefers-reduced-motion` no hay ondas: la vista cambia directamente.
- **Cards** (portada de disco, de P2): grid de 4 columnas (2 entre 768 y 1200px, 1 en móvil) con gap de 20px; cada card es un `<button>`:
  - arte de 230px (210px en móvil): funda de 150px con el número (Cinzel 36px, dorado) y la etiqueta; detrás, un disco de 210px que al hacer hover sale de la funda (`translateX(38px) rotate(40deg)`); estampa dorada redonda de 92px girada −8° con "Desde / precio / MXN";
  - cuerpo: nombre (Cinzel 28px), descripción corta (15px, #bbb) y "Ver contenido →" dorado.
  - Debajo del grid, la nota de precios (`packagesNote`).
- **Detalle** (`PackageDrawer.tsx`): panel que entra desde la derecha (`min(600px, 100%)`, borde izquierdo dorado), con fondo oscurecido:
  - etiqueta "Paquete 0X · tag", botón cerrar redondo, nombre (Cinzel 48px), precio (Cinzel 34px dorado + "MXN · [IVA]"), descripción completa;
  - lista "Lado A · Incluye" (A1, A2…), entrega y sesiones, y el botón "Reservar este paquete" (a `/reservar`) al fondo;
  - se cierra con la X, clic fuera o Escape; bloquea el scroll del body, enfoca el botón cerrar y devuelve el foco a la card.
- **Datos:** `src/data/packages.ts` (`Package` en `types.ts`). Precios, IVA, tiempos y cantidades son marcadores `[..]` hasta tener los reales.

---

## 5. Vista 4 — Artistas · "Tracklist" (`04-Artistas.dc.html`, `id="artistas"`)

Datos (`src/data`):

| Código | Lado | Nombre | Género | Patrón de la miniatura (SVG, viewBox 72) |
|---|---|---|---|---|
| A1 | A | Sofía M. | R&B · Soul | 4 círculos concéntricos (r 30/22/14/6) |
| A2 | A | RALO | Hip-Hop · Trap | 8 diagonales paralelas |
| A3 | A | Los Ecos *(provisional)* | Rock · Alternativo | 4 ondas horizontales |
| B1 | B | Luna K. | Pop · Indie | 3 triángulos anidados |
| B2 | B | Mara V. *(provisional)* | Folk · Cantautora | 6 barras tipo ecualizador |
| B3 | B | NÉBULA *(provisional)* | Electrónica · Synth-pop | aspa con 9 puntos |
| B14 | B | Tu banda (CTA, texto dorado) | "Reserva tu sesión" → #reservar | marco con borde punteado (`stroke-dasharray 4 4`) y un "+" en el centro |

Las miniaturas tienen fondo `#0a0a0a`, borde `#333` y trazos dorados con `stroke-opacity` de 0.5 (en la CTA, 0.7). La fila CTA "Tu banda" va siempre al final del Lado B (cambio del 2026-10-09: se agregaron A3, B2 y B3).

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

**Lista con scroll** (estilo **S6 · Combinada** del canvas https://claude.ai/artifact/QJkRJorDbVXgAKWynFXrae, 2026-10-09):
- En desktop y tablet solo la lista de artistas hace scroll: un contenedor de 520px de alto sin barra visible (`overscroll-behavior: contain`). La sección pasa a padding vertical de 64px.
- **Controles** a la derecha (columna de 56px): botones ▲ ▼ redondos estilo transporte (como los de la galería; hover dorado; deshabilitados en cada extremo) y entre ellos el contador "04–08" / "de 26" (`aria-live`). Cada botón avanza un artista; al primero de cada lado se llega mostrando su cabecera. La rueda del mouse, el teclado y el touch usan el scroll nativo.
- **Difuminado** (de S1): máscara en las orillas, arriba 36px solo si ya se bajó y abajo 72px solo si quedan artistas.
- **Tocadiscos** (de S5): el disco ya no gira solo; gira según el avance de la lista (3 vueltas en total, transición de 0.6s). Un arco dorado alrededor del disco marca el avance y el brazo del tocadiscos baja de −28° a −4°.
- **Móvil**: sin scroll interno ni controles; la lista sigue el scroll de la página y el disco compacto sigue girando solo.
- Con `prefers-reduced-motion` no hay transiciones ni giro.

**Catálogo** (2026-10-09): 26 artistas (A1–A13, B1–B13) y la CTA "Tu banda" como B14. Salvo Sofía M., RALO y Luna K. los nombres son provisionales. Cada artista tiene entre 1 y 10 videos y fotos de marcador (elegidos al azar una vez y fijos en `src/data/artists.ts`). Los datos se arman con el helper `artist()`.

**Cambios del 2026-10-08:**
- **El disco gira**: un `<g>` interno del SVG rota 360° cada 6s, lineal e infinito; sin animación con `prefers-reduced-motion`. Se rota el `<g>` y no el `<svg>`, porque rotar el `<svg>` agranda su caja y genera scroll horizontal.
- **Panel del artista** (estilo **V6 · Combinada** del canvas https://claude.ai/artifact/9z7ye3aqYqZ3ZQuqYeabYQ): las filas de artistas (A1–A13, B1–B13) son `<button>` que abren el mismo panel lateral que los paquetes (`shared/Drawer.tsx`, ver §4.1 Detalle). La fila CTA "Tu banda" (B14) sigue siendo un link a `/reservar`.
  - **Panel derecho** (`ArtistDrawer.tsx`):
    - etiqueta "A1 · Lado A" y botón cerrar;
    - cabecera con un mini vinilo de 88px (64px en móvil) que gira cada 4s, y a su derecha el nombre (Cinzel 44px) y el género (Cinzel 22px dorado);
    - bio, cita (si tiene; Sofía M. usa el testimonio);
    - **Redes**: íconos redondos de 48px (Instagram, Spotify, YouTube, TikTok), borde `#444`, hover dorado; abren en otra pestaña;
    - **Galería**: dos pills de 56px, "▶ Ver videos" y "Ver fotos"; la activa queda en dorado (`aria-pressed`);
    - botón "Reserva tu sesión" (a `/reservar`) al fondo.
  - **Panel izquierdo** (`MediaPanel.tsx`): aparece solo al tocar Ver videos / Ver fotos.
    - Ocupa el espacio a la izquierda del panel derecho (`right: min(600px, 100%)`), fondo `#050505`, entra desde la izquierda; por debajo de 1200px cubre la pantalla completa sobre el panel derecho.
    - Cabecera: nombre del artista (kicker dorado), "Videos" o "Fotos" (Cinzel 34px) y botón "Cerrar galería".
    - **Carrusel**: pieza central de `min(400px, 60%)` cuadrada con borde dorado y glow; las vecinas a ±75% del ancho, escala 0.7 y opacidad 0.35; las demás ocultas. Transición de 0.55s.
    - Controles (estilo **A2 · Controles de transporte**, canvas https://claude.ai/artifact/EkLvHkrq9ZjXCCVh5fQYh3): botones redondos de 56px, fondo `#0a0a0a`, borde `#444`, sombra interior, con íconos ⏮ ⏭ dorados; en hover se rellenan de dorado (ícono negro, glow) y al presionar escalan a 0.95. Al centro el título, el detalle (duración o crédito) y "n / total" (`aria-live`).
    - **Tira de negativo** (detalle de V4) abajo: perforaciones arriba y abajo, cuadros numerados 1A, 2A… que también seleccionan; el elegido lleva el marcador **M1 · Visor de cámara** (canvas https://claude.ai/artifact/5Bv9U17z3CZJF4baMCxEw3): cuatro esquinas doradas de 14×2px a 6px del cuadro y un punto dorado encendido de 6px arriba a la derecha.
    - **Botón de play** (estilo **P2 · Anillo con ondas**, canvas https://claude.ai/artifact/E7jggRfr23CF5yeAz5HMRd): círculo de 84px con borde dorado de 1.5px, fondo `rgba(0,0,0,.6)` y ▶ dorado; dos ondas doradas salen de él cada 2.2s (desfasadas 1.1s, escala 1→1.9) solo en la pieza central y sin ellas con `prefers-reduced-motion`; en hover se rellena de dorado con el ícono negro.
    - Videos: con `embed`, el play de la pieza central carga el iframe; sin `embed` se muestra un marcador. Fotos: con `src` se muestra la imagen; sin `src`, un marcador con el título.
    - Escape cierra primero la galería y devuelve el foco al botón que la abrió; un segundo Escape cierra el panel.
  - Datos en `src/data/artists.ts`: `bio`, `quote`, `socials` (`platform` + `href`), `videos` y `photos` (`MediaItem`: `title`, `detail`, `src?`, `embed?`). Hoy los links apuntan a la página principal de cada red y la galería son marcadores `[..]`.

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

## 7.1 Preguntas frecuentes · "Q3 · Vinilo" (`/faq`, canvas https://claude.ai/artifact/1rUT6F1qKzszW1N5jpsLr9)

- **Encabezado** centrado: eyebrow con línea a ambos lados "Preguntas frecuentes" y h1 "Pon la aguja *en tu duda.*" (cierre dorado).
- **Cuerpo** en grid 5fr / 7fr con gap de 72px:
  - **Izquierda**: lista de 8 preguntas (`<ol>` con bordes `#333`). Cada una es un `<button aria-pressed>` con número (Cinzel 14px dorado), pregunta (17px) y una flecha dorada que solo se ve en la activa. La activa va en dorado, fondo `#0a0a0a` y padding izquierdo de 18px.
  - **Derecha**: tocadiscos y respuesta.
    - Disco de `min(560px, 100%)`, alineado a la derecha: surcos dorados al 25%, arco de reflejo y etiqueta dorada de r100 con "Pregunta / 04 / de 08". Al cambiar de pregunta el disco gira a `n × 72°` en 0.9s (`cubic-bezier(.3,.7,.2,1)`).
    - Brazo del tocadiscos arriba a la derecha (34% del ancho del disco).
    - Panel de respuesta (`aria-live="polite"`) que se monta 160px sobre el disco, con margen derecho de 120px: borde dorado, fondo `#050505` y glow. Lleva "Track 04", la pregunta (Cinzel 32px), la respuesta (17px, #bbb) y un pie con "¿Otra duda? Escríbenos →" (a `/contacto`) y el botón pill "Siguiente pregunta →".
- **Móvil**: el tocadiscos (260px) y la respuesta van primero y la lista debajo; al tocar una pregunta, la página se desplaza hasta la respuesta. El botón "Siguiente" ocupa todo el ancho.
- **Datos**: `src/data/faq.ts`. Las respuestas tienen marcadores `[..]` (tiempos, pagos, anticipo, cancelaciones).

---

## 8. Vista 7 — Footer (`07-Footer.dc.html`)

### Desktop (1440 × 140)
- `<footer>` de 140px de alto, padding 0 80px y `border-top: 1px solid #333`, en grid de 3 columnas con `align-items: center`:
  1. **Izquierda**: el logo (22/11px), alineado a la izquierda.
  2. **Centro**: `<nav aria-label="Redes sociales">` con Instagram ◆ Spotify ◆ YouTube.
     - Links de 14px, tracking 0.2em, mayúsculas, #bbb, con hover en dorado.
     - Los ◆ van en dorado de 8px, con `aria-hidden`.
     - Gap de 28px.
  3. **Derecha**: "© 2026 Hathor Frequency · MX", 14px, tracking 0.08em, #bbb.

### Móvil (390 × ~280)
- Todo apilado y centrado, con padding 40px 16px y gap de 24px:
  1. el logo, centrado;
  2. las redes como zonas táctiles de 44px (13px, tracking 0.15em), con los ◆ de 7px;
  3. el © de 13px, con padding-top de 16px y `border-top: 1px solid #222` a todo el ancho.

---

## 9. Accesibilidad (obligatoria)

- HTML semántico: `header`, `nav` con `aria-label`, `section` con `aria-labelledby`, `article` en los canales, `dl` en las cifras, `figure`/`blockquote`/`figcaption` en el testimonio, `fieldset`/`legend` en los horarios y `aside` en el panel de la sesión.
- Un solo `h1` por página: el titular de su vista (en Inicio, el del hero). Los elementos internos llevan `h3`.
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
- **Navegación**: "Estudio" (`/estudio`) muestra una página provisional hasta que tenga diseño.
- **Envíos**: falta definir a dónde van el formulario de contacto y la reserva (backend o servicio).
- **Calendario**: la disponibilidad y la navegación entre meses son estáticas en el diseño.
- **Redes**: Contacto repite los links que también aparecen en el Footer (decisión abierta).
- **Artistas y FAQ**: faltan las bios, redes (links), videos y fotos reales de los artistas, y los datos de las respuestas de FAQ (marcadores `[..]`).
- **Nav**: el rango 768–1199px usa el nav móvil (hamburguesa) porque con FAQs no cabe el nav completo; no hay diseño específico de tablet.
- **Tablet**: no hay diseño para 768–1200px; se usa el layout desktop fluido.
- **Paquetes**: faltan los paquetes reales (nombres, contenido, precios, IVA, tiempos de entrega y sesiones); hoy son una propuesta con marcadores `[..]`. "Reservar este paquete" lleva a `/reservar` sin preseleccionar el paquete.
