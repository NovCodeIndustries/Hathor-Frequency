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
  - `/estudio` → Estudio (§7.2);
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

**Platillo volador que explora el sitio** (`Ufo/Ufo.tsx`, montado en el Layout; canvas https://claude.ai/artifact/GeKw8rC76CQZrMobAR9EKF, 2026-10-09): un platillo oscuro con borde dorado, 7 luces que parpadean y el extraterrestre G2 en la cabina, en una capa fija sobre la vista actual (z-index 9, bajo el nav; no bloquea clics). Aparece en **todas las vistas** con una espera al azar de 15–30s (`ufoSchedule` en `src/data/site.ts`) desde que termina la anterior, solo con la pestaña visible; el horario sigue al navegar entre páginas. En cada aparición hace una acción, en orden barajado por ronda:
- **U2 · Escucha** (12s): baja al centro, abre un rayo dorado mientras suben 5 notas ♪♫♬ y se va de un tirón con estela.
- **U3 · Zigzag** (10s): aparece como estrella, salta entre 5 puntos, se detiene y desaparece con destello y anillo.
- **U4 · Scratch** (12s): baja junto a un vinilo visible (Home, Artistas o FAQ), le apunta un rayo corto y el vinilo va y viene (`rotate`, se suma a su giro), con ondas doradas.
- **U5 · Letra** (13s): sobre la palabra dorada de un titular visible (una sola línea), se lleva una letra con el rayo (sube girando y desaparece) y la devuelve (cae y rebota). Trabaja sobre una copia de la palabra; la original solo se oculta mientras tanto y vuelve si se hace scroll.
- **U6 · Onda** (11s): cruza el cielo en onda (`offset-path`) dibujando una estela dorada que brilla y se desvanece.
- **Acciones con los componentes de cada página** (P1–P6 del canvas https://claude.ai/artifact/JMzbfjJigEjVAr5XLYy6X1, `Ufo/pageFlights.tsx`): el platillo llega, se queda encima del objetivo con su rayo y se va; todo es visual y temporal (Web Animations y elementos propios en su capa), sin cambiar estado ni datos:
  - **P1 · Servicios** (10s): sube el fader del CH 02 a +10 (en móvil, a la derecha) con el cap y el LED encendidos, y lo regresa con rebote de fader motorizado.
  - **P2 · Reservar** (10s): ilumina en dorado un día libre al azar, le pone un sello de platillo y la etiqueta "Apartado por Andrómeda", y lo deja como estaba.
  - **P3 · Artistas** (11s): se lleva un track de la lista (sube y desaparece en el rayo); en su lugar se lee "— Transmitiendo a otra galaxia —" y luego lo devuelve con rebote.
  - **P4 · Contacto** (11s): con el campo vacío y sin foco, escribe "saludos@andromeda.fm" letra por letra con cursor y lo borra; si la persona toca el campo, se quita al instante. Nunca escribe en el input real.
  - **P5 · Home** (10s): la cifra de proyectos rueda de 200+ a 201+ y la etiqueta cambia a "Proyectos · uno marciano"; luego vuelve.
  - **P6 · Ticker** (10s): detiene la banda, se lleva "Mezcla" (u otra palabra a la vista) y la regresa; la banda sigue al terminar.
- **Temporadas** (canvas https://claude.ai/artifact/G3ndhJatQyyn9ZNA7UpeBZ, datos en `src/data/seasons.ts`, efectos en `Ufo/seasonFlights.tsx`, arte en `Ufo/seasonArt.tsx`): cada una se activa el día 1 de su mes y se quita al terminar el mes (fecha local del visitante); `?temporada=<id>` la fuerza para probarla. Durante su mes el platillo sale **disfrazado** en todos sus vuelos (disfraz en la cabina, luces y color del rayo de la temporada; calavera en Día de Muertos) y sus 6 acciones de temporada **reemplazan** a P1–P6:
  - **Enero · Año Nuevo** (`anoNuevo`): fuegos artificiales y confeti con "¡Feliz Año Nuevo!" sobre el título · cuenta regresiva: los faders suben uno tras otro · caen uvas en un track ("12 uvas, 12 canciones") · el 1 con copa "Primera sesión del año" · `deseos@andromeda.fm` · "Feliz Año Nuevo".
  - **Febrero · Amor y amistad** (`amor`): corazón que late en la etiqueta del vinilo y corazones que suben · caps rosas con un corazón sobre cada canal · carta "Para Luna K. ♥" · el 14 "Sesión para dos" · `cupido@andromeda.fm` · "Mezcla ♥".
  - **Abril · Día del Niño** (`nino`): globo en la etiqueta y globos de colores · faders de colores que suben y bajan · avión de papel "“¡Otra vez!”" · el 30 con globo · `recreo@andromeda.fm` · "¡A jugar!".
  - **Mayo · Día de las Madres** (`madres`): rosa en la etiqueta y rosas que brotan · caps rosa palo con una rosa sobre cada canal · ramo "Para todas las mamás que nos llevaron al primer ensayo" · el 10 "Serenata para mamá" · `serenata@andromeda.fm` · "Para mamá ♥".
  - **Septiembre · Fiestas patrias** (`independencia`): cohetes verde, blanco y rojo con "¡Viva México!" · CH1–CH3 en verde, blanco y rojo · papel picado sobre un track · el 15 con campana "Noche del Grito" · `viva@mexico.fm` · "¡Viva México!".
  - **Octubre · Halloween** (`halloween`): calabaza en la etiqueta y murciélagos · todos los faders se desploman y brillan morados · el track 02 se vuelve fantasma con "¡Bu!" · el 31 "Sesión de terror" · `bu@ultratumba.fm` · salen murciélagos del ticker.
  - **Noviembre · Día de Muertos** (`muertos`): camino de pétalos de cempasúchil hasta el vinilo · una veladora sobre cada canal · pan de muerto y veladora "Para los que pusieron la música antes" · el 2 con calaverita · `catrina@mictlan.fm` · "Calaverita".
  - **Diciembre · Navidad** (`navidad`): corona navideña en la etiqueta y nieve · caps rojos y verdes con luces de colores sobre la consola · regalo "Regalo para RALO" · el 24 con estrella "Sesión navideña" · `santa@polonorte.fm` · "Feliz Navidad".
  - Las etiquetas del calendario son solo visuales; no apartan ni bloquean fechas.
  - **Cumpleaños** (`cumpleMarzo` el 3 de marzo y `cumpleAbril` el 16 de abril): duran **solo ese día** y ese día ganan sobre la temporada del mes (el 16 de abril sustituye a Día del Niño). Platillo con gorro de fiesta y dos globos; fuegos y confeti con "¡Feliz cumpleaños, [NOMBRE]!" · faders de fiesta en cuenta regresiva · regalo y pastel "Para [NOMBRE] ♥" · el día marcado con pastel "Cumpleaños de [NOMBRE]" · `pastel@andromeda.fm` · "¡Feliz cumple!". Los nombres son marcadores (`BIRTHDAY_NAME` en `seasons.ts`).
- **Capa fija de temporada en todas las páginas** (canvas https://claude.ai/artifact/YL2L4g49hnmmboNEfLuRR4, campo `page` de cada temporada, hook `useSeason`): mientras la temporada está activa, sin depender del platillo:
  - **Todas las páginas**: adorno bajo el menú (`Season/SeasonGarland.tsx`: papel picado, luces que parpadean, confeti o una hilera de glifos), un glifo junto a "HATHOR" en el logo del menú, la palabra del mes en el ticker con su separador (♥, ❄, ★, ✿…) en el color del mes, y un mensaje del mes bajo el copyright del footer. El color del mes queda en `--season-acc` en la raíz del documento (y `data-season` en `<html>`).
  - **Home**: glifo grande sobre la etiqueta del vinilo, 8 partículas que flotan (o nieve que cae) y el cierre del titular cambia ("Donde la música *suena a México.*", "*da miedo.*", "*huele a ponche.*").
  - **Servicios**: los caps de los faders toman los colores del mes (`--cap-season`).
  - **Reservar**: el día de la temporada lleva borde del color del mes, su glifo en la esquina y la etiqueta como `title`/`aria-label` (solo visual).
  - **Contacto**: el campo de correo cambia su texto de ejemplo. **Estudio**: el eyebrow del tour cambia ("Estudio · Edición navideña").
  - **Modales**: la confirmación de Reservar y los paneles de detalle (paquetes y artistas) toman el borde, el glow y los anillos del color del mes y llevan el glifo junto a su etiqueta; la confirmación agrega el mensaje del mes. La pantalla del extraterrestre de Servicios toma el borde del color del mes.
  - **Bienvenida** ("Sintonizando"): adorno de la temporada arriba, partículas detrás, "Estás sintonizando · {temporada}", el glifo del mes junto a "HATHOR", el mensaje del mes bajo el eslogan, y la aguja, el LED, el ecualizador, la marca HF y la barra de progreso en el color del mes. El acento se aplica antes del primer cuadro (`useLayoutEffect` en el Layout) para que la bienvenida ya salga con él.
  - **Easter eggs**: en la pantalla del extraterrestre de Servicios, el glifo del mes flota sobre su cabeza, el texto de la etiqueta del vinil, las lecturas y la barra de 10s van en el color del mes, y el log suma "› Señal de temporada: {palabra del mes}". En el concierto de Reservar, uno de los carteles del público lleva la palabra del mes, el amplificador lleva el glifo junto a "Hathor", la cuarta imagen de la pantalla LED es la de la temporada (glifo + palabra), las lámparas y la pantalla brillan en el color del mes y los haces de luz usan sus colores. La tarjeta móvil del concierto lleva el borde, el "● En vivo" y la barra en el color del mes, con el glifo.
  - Con reduced-motion, las luces no parpadean y las partículas no se mueven (la nieve no aparece).
- Las acciones con objetivo (U4, U5 y P1–P6) se saltan si su objetivo no está a la vista; si la página se mueve (scroll o resize) a la mitad, todo vuelve a su lugar al instante. Con `?ovni=1` la primera sale a los 1.5s. En móvil el platillo y los efectos van al 60–65% y el margen superior baja a 84px. No aparece con reduced-motion.



> **Hero reemplazado (2026-10-09) por "I1 · Vinilo gigante"** (canvas https://claude.ai/artifact/DexdEVMp8wnzBScWZ7GAu5). El Nav de esta sección sigue vigente; la descripción del hero que viene abajo queda como referencia histórica.
> - Sección de mínimo 760px, contenido centrado (máx. 1200px). Detrás, un vinilo de 980px (640px en móvil) centrado al 58% del alto, con opacidad 0.55, que gira cada 24s (un `<g>` interno; sin giro con `prefers-reduced-motion`), cubierto por una viñeta radial negra.
> - Eyebrow con línea a ambos lados "Sello discográfico independiente"; h1 "Donde la música / *toma forma.*" (Cinzel 92px, lh 0.95; 72px en tablet, 44px en móvil; la segunda línea en dorado con glow); subtítulo (20px, #bbb) y eslogan (cursiva dorada); botones "Comenzar proyecto" (a `/reservar`) y "Ver portafolio" (a `/artistas`), apilados a todo el ancho en móvil.
> - Cifras en una fila con ◆ dorados entre ellas: número en Cinzel 40px dorado (30px en móvil) y etiqueta en mayúsculas de 12px. Ya no hay columna derecha ni frase de impacto.

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

**Escala dB y pistas del easter egg** (estilo **F6 · Combinada** del canvas https://claude.ai/artifact/WX4AytuWMigiv3Lq5oqZTU, 2026-10-09):
- **Escala dB** junto a cada fader (`db.ts`): +10, +5, 0, −5, −10, −20, −30, −40, −∞, en monoespaciada de 10px #666, con rayitas de 6px (la del 0 de 10px y más clara). Las marcas van a la altura del nivel correspondiente (100, 87, 75, 62, 50, 37, 25, 12, 0). Debajo de la descripción se muestra el valor exacto ("−7.3 dB", interpolado) y el slider lo anuncia con `aria-valuetext`. En tablet y móvil se ocultan +5, −5, −30 y −40; en móvil la escala va debajo del fader horizontal.
- **Pista al acertar**: cuando el usuario mueve un fader y queda en su zona del easter egg (solo cuentan los faders movidos; Mezcla y Masterización arrancan dentro de su zona), el canal se enciende: borde dorado oscuro, LED fijo con glow y del cap salen dos ondas doradas continuas (1.6s, desfasadas 0.8s).
- **Osciloscopio** arriba de la consola (`SignalScope.tsx`, 96px; 72px en móvil): onda dorada con ruido que se limpia con cada acierto (semilla fija, transición de 0.6s) y "Sintonizando · 0–100%".
- **Canal MASTER** (`MasterMeter.tsx`), sexta columna de 120px (84px en tablet; fila horizontal en móvil): 5 LEDs de consola de abajo arriba, verde, verde, amarillo, amarillo y rojo; encendidos con degradado, glow de su color y reflejo blanco, apagados con su color muy tenue. Debajo, "Señal n/5" (`aria-live`). Borde dorado desde el primer acierto y glow desde el tercero. El rojo se enciende con el quinto, justo cuando aparece el extraterrestre.
- Con `prefers-reduced-motion` no hay ondas en el cap ni transición en la onda.

**Easter egg "Contacto establecido"** (`AlienSignal.tsx`, estilo **A3 · Osciloscopio** del canvas https://claude.ai/artifact/Y1xkrireKBrrmBSM7iswed):
- **Combinación:** se dispara cuando los faders quedan en CH1 abajo (≤ 15) · CH2 mitad (40–60) · CH3 arriba (≥ 85) · CH4 mitad · CH5 abajo. Con cualquier otra posición no pasa nada.
- **Repetición:** se activa solo al entrar en la combinación. Para volver a verlo hay que salir de ella y volver a formarla.
- **Contenedor:** pantalla completa (`position: fixed`, z-index 100, fondo #000), flex en columna centrada con gap de 40px y padding 56px 80px.
- **Pantalla del osciloscopio:**
  - ancho `min(1040px, 100%)`, proporción 2:1 (como máximo 58vh de alto), borde #333, radius de 6px, fondo #050505 y glow interior dorado;
  - cuadrícula de 52px al 8%, más los ejes centrales al 18%;
  - barrido dorado que cruza la pantalla cada 2.4s;
  - lecturas en las esquinas (12px, tracking 0.2em): "CH 01–05", "Freq 432 Hz", LED + "Señal 100%" y "Origen · desconocido".
- **Vinil girando** (**X5** del canvas https://claude.ai/artifact/9EySKjX5Xhx9H9txrSBHYd, 2026-10-09; reemplaza al rostro grande y a la onda punteada):
  - disco negro (#0a0a0a) con borde #B8860B, al 88.5% del alto de la pantalla y centrado; 15 surcos dorados al 16% con dos bandas lisas, y dos reflejos opuestos al 10%;
  - gira a 33⅓ RPM (una vuelta cada 1.8s) junto con la etiqueta: negra, borde dorado, anillo interior al 40% y el texto "HATHOR FREQUENCY · LADO A · 33⅓ RPM" en Cinzel 12px sobre un círculo;
  - en el centro, el rostro **fijo** (no gira): relleno de ondas senoidales, contorno dorado, ojos negros con borde dorado, sin pupilas ni boca; su glow late cada 2.4s;
  - brazo de tornamesa a la derecha: pivote dorado arriba y la aguja sobre los surcos de afuera.
- **Texto:** grid de 2 columnas con gap de 64px.
  - Izquierda: H2 Cinzel 56px "Contacto **establecido.**", con la segunda palabra en degradado dorado.
  - Derecha: log de 14px en mayúsculas, tracking 0.15em, con "›" dorados:
    - "Decodificando la mezcla… 100%";
    - "Patrón 1·2·3·2·1 reconocido";
    - "Mensaje: “Suena increíble desde aquí.”" (en blanco);
    - la nota "Se cierra en 10 s · clic o Esc para cerrar" (12px, #888).
- **Cuenta regresiva:** barra dorada de 3px abajo que se vacía en 10s.
- **Móvil:** pantalla en proporción 4:5 (como máximo 52vh), el disco al 86% del ancho con el brazo entrando desde el borde derecho, lecturas de 10px (sin "Freq"), texto apilado y H2 de 34px.
- **Cierre:** se quita sola a los **10 s**, o antes con clic o Escape.
- **Regreso de los faders** (**R2 · Escalonado** del canvas https://claude.ai/artifact/ShmXaiYdDdhChAVh7n6qv3): **1 s** después de cerrar la señal, los faders vuelven a su nivel inicial (`src/data/services.ts`), de CH1 a CH5, cada uno 110ms después del anterior. Cada fader tarda 650ms y se asienta con un pequeño rebote (easeOutBack suave). Mientras regresan no se pueden mover. Al arrancar el regreso se apagan las ondas de los caps y el easter egg queda listo para repetirse. Con reduced-motion saltan directo a su posición.
- **Movimiento:** con reduced-motion el disco no gira y se desactivan el glow del rostro, las animaciones y el barrido.

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

Cambio del 2026-10-08. `/servicios` tiene dos vistas, Servicios (la consola) y Paquetes, que se alternan sin cambiar de ruta. La vista activa vive en la URL: `/servicios?vista=paquetes` abre directo los paquetes (lo usa "Cotizar un video" de Estudio) y al cambiar con el interruptor se actualiza el parámetro sin agregar historial.
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
- **Aviso de precios** (2026-10-10): sobre la grilla de paquetes, una banda con ícono de información dorado, borde `#B8860B`, fondo dorado al 6% y radius de 6px: "**Precios y descripciones sujetos a cambios.** Confirma el precio final y lo que incluye con tu asesor antes de reservar." (15px; 14px en móvil). En el detalle de cada paquete, la primera frase va en itálica #888 bajo el precio. Textos en `packagesDisclaimer` (`src/data/packages.ts`).

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
  4. **Tus datos** (diseño **RA · Datos en el panel** del canvas https://claude.ai/artifact/VuPzsH4vpZaQc3XDpAXBzL, 2026-10-09; reemplaza la nota de tiempo de respuesta):
     - encabezado con borde superior `#222` y padding-top de 24px: "Tus datos" (como "Tu sesión") y "Para confirmar la sesión y darte seguimiento." (14px, #bbb);
     - "Banda o proyecto": input pill de 52px (mismo estilo que el select, clase `hf-input`);
     - `<fieldset>` "Representante": dos pills de 48px en 2 columnas, "Integrante de la banda" / "Externo" (`aria-pressed`, mismo estilo que los horarios), el input del nombre (placeholder según el tipo) y una ayuda de 13px #888 que cambia: "La persona de la banda a la que contactaremos." / "Alguien fuera de la banda que coordina la sesión: mánager, productor o similar.";
     - "Número de contacto" (`type="tel"`, mínimo 8 dígitos) y "Correo" (`type="email"`).
     - Los cuatro datos son obligatorios (validación nativa del navegador). Textos en `representativeTypes` de `src/data/booking.ts`.
  5. Botón primario a todo el ancho, de 56px de alto y con `margin-top: auto`: "Reservar 15:00 h".
  6. **Modal de confirmación** (`BookingModal.tsx`) al enviar con éxito, sobre un fondo negro al 80%:
     - tarjeta de `min(560px, 100%)`, borde dorado, fondo `#050505`, glow, padding 48px 44px 40px y anillos dorados en la esquina superior derecha; ✕ redonda de 44px arriba a la derecha;
     - palomita en círculo dorado de 56px, "Solicitud enviada" (12px, tracking 0.3em, dorado), H2 Cinzel 36px "Tu sesión *está en camino.*" y "Un asesor se pondrá en contacto contigo para continuar con los siguientes pasos." (17px);
     - resumen (`dl`, líneas `#222` arriba y abajo): Sesión (día · hora · servicio), Proyecto y Contacto (representante, tipo y teléfono);
     - botón primario "Entendido" de 52px. Se cierra también con la ✕, clic fuera o Escape; enfoca "Entendido", bloquea el scroll y devuelve el foco al cerrar. Al cerrar, el formulario queda limpio.
     - Móvil: padding 40px 20px 24px, H2 de 28px y el resumen apilado.
- **Easter egg · extraterrestre rockero** (`RockAlien.tsx`, estilo **G2 · Contorno dorado** del canvas https://claude.ai/artifact/1JGW3LSBYg1RTnKuqMzJUu, 2026-10-09):
  - **Cuándo** (cambio del 2026-10-09): cada 15 s (`rockAlienSchedule.intervalSeconds` en `src/data/booking.ts`) mientras `/reservar` está abierta y la pestaña visible: la primera vez a los 15 s de entrar y luego 15 s después de que termina la escena anterior. Si la pestaña se oculta, la espera se pausa y vuelve a empezar al regresar. Con `?alien=1` la primera sale al cargar. Solo en pantallas ≥ 1100px y nunca con `prefers-reduced-motion`. Es decorativo (`aria-hidden`).
  - **Escenario:** 340px de alto debajo del calendario, desde el borde izquierdo de la pantalla hasta el borde derecho de la columna; piso dorado tenue a 300px. Solo existe mientras corre la escena.
  - **Luces de escenario** (2026-10-09): rack arriba del escenario (680px, centrado) con 5 lámparas, apagadas hasta que empieza a tocar; entonces se encienden en dorado y salen 5 haces (dorado, blanco cálido y dorado oscuro, baja opacidad, `mix-blend-mode: screen`) que barren ±22° a ritmos distintos (2.6–3.6s), además del reflector central. En el headbanging los haces barren 3 veces más rápido y parpadean al ritmo (0.36s). Se apagan cuando el extraterrestre se va.
  - **Público** (2026-10-09): cuando empieza a tocar, entran corriendo desde la izquierda (escalonados 60ms) extraterrestres G2 más chicos que llenan el espacio entre el borde de la pantalla y el músico (hasta 16, uno cada ~24px), intercalados en 3 filas: atrás al 54% (opacidad 0.5, 14px más arriba), en medio al 66% (0.75, 7px) y adelante al 80%. En cada función se reparte al azar quién levanta los brazos (~60%) y quién hace los cuernos, y **solo 2 o 3** sostienen un **cartel** con los dos brazos. Los carteles son de cartón (#f1e6c8, borde #b9a77a, texto negro 10px/600 en mayúsculas; 9px en las filas de atrás), van sobre la cabeza con una inclinación al azar de ±7° y brincan con quien los sostiene; los textos salen revueltos de `SIGNS` en `RockAlien.tsx` ("¡Otra!", "Venimos en paz", "Toca algo de Marte", "¿Y el bajista?", "1·2·3·2·1", "432 Hz o nada"…). Brincan al ritmo (6px cada 0.44s, desfasados) y en el headbanging saltan más (18px a 0.36s) y agitan los brazos. Se van con él al final.
  - **Pantalla LED** (2026-10-09): arriba del público (top 30px), centrada en su espacio y de hasta 360px de ancho (no aparece si caben menos de 160px), proporción 10:3, marco `#444` con glow dorado, rejilla de LEDs de 4px y líneas de barrido encima. Se enciende con parpadeo cuando empieza a tocar y rota 4 imágenes cada 1.8s: el logo "HATHOR / Frequency", un vinil dorado girando con "HF" y "Hathor Frequency", "● Live" con un ecualizador de 12 barras y "Por músicos, *para músicos.*". Los tamaños del contenido van en `cqw` para escalar con la pantalla.
  - **Torres de fuego** (2026-10-09): cuando empieza a tocar, entre el público hay 2 o 3 emisores en el piso (3 si el espacio del público pasa de 260px, 2 si pasa de 120px, ninguno si no) repartidos a lo ancho. Cada uno dispara una columna de fuego de ~214px (llama recortada en zigzag, degradado de blanco cálido a dorado, naranja y rojo transparente, con un núcleo claro, glow y parpadeo) que sale de abajo, se sostiene y se apaga cada 1.4s, desfasadas entre sí, con un brillo naranja en el piso. En el headbanging disparan al doble de ritmo (0.72s). Se apagan cuando el músico se va.
  - **Pantallas angostas** (< 1100px · **M1 · Escenario en línea** del canvas https://claude.ai/artifact/JMzbfjJigEjVAr5XLYy6X1, `RockAlienMini.tsx`): en lugar del escenario grande, con el mismo intervalo se abre debajo del calendario una tarjeta (borde dorado oscuro, fondo #050505) que empuja el contenido: "● En vivo desde el estudio" y ✕ de 44px arriba, una escena chica en un solo SVG 2:1 (máx. 520px: músico con cuernos, rasgueo y headbanging, 5 aliens de público brincando, 2 luces que barren y el amplificador con ondas) y una barra dorada de 2px que se vacía en 14s; luego se cierra sola. Sin fuego, pantalla LED ni carteles. Con ✕ se cierra y no vuelve a salir en esa visita.
  - **Personaje G2:** gris muy oscuro (#2a2d31) con contorno dorado, ojos negros con borde dorado y brillo, y un glow dorado suave.
  - **Escena (~24 s):** 1) el amplificador estilo stack (cabezal con "Hathor" en cursiva y 4 perillas, bocina con rejilla y borde dorado oscuro; sin logo de marca) **sube desde el piso** con un brillo en el suelo; 2) el extraterrestre se asoma por la izquierda, inclinado, y mira; 3) camina al centro (3s); 4) mira el amplificador; 5) sale corriendo a la izquierda, volteado; 6) salen volando hacia el centro en arco una baqueta, una púa, un platillo, un calcetín, un cable y una partitura; 7) regresa corriendo con guitarra eléctrica dorada y peluca larga; 8) toca (rasgueo y cabeceo) con reflector y ondas en el amplificador; 9) **cuernos y headbanging**: solo dos brazos, el de los cuernos en alto y el que rasguea (el del mástil se oculta), con la peluca siguiendo la cabeza; 10) sigue tocando; 11) se va corriendo a la izquierda, las cosas se desvanecen y el amplificador baja al piso.

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
     - tus datos con inputs de 52px (padding 0 18px) y pills de representante de 14px;
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
  3c. **Nombre y tema** (agregados el 2026-10-09), arriba de la pill del correo y con su mismo estilo (pill de 60px, borde `#444`, fondo `rgba(0,0,0,0.8)`, padding 6px 28px, labels sr-only), con 12px entre pills:
     - "Tu nombre" (`autocomplete="name"`, obligatorio);
     - selector "¿Sobre qué quieres información?" (obligatorio; el texto de ejemplo en #888 hasta elegir, flecha dorada a la derecha): Grabación, Mezcla, Masterización, Video, Live Sessions, Paquetes, Visita al estudio y Otro (`contactTopics` en `src/data/site.ts`).
     - En móvil van apilados como el correo: pills propias de 54px con el texto centrado.
     - Se guardan en `ContactRequest.name` y `ContactRequest.topic` (migración `contact_name_topic`); el envío sigue simulado en `submitContact`.
  4. Formulario de 560px de ancho, con padding-top de 8px. El label "Tu correo" queda oculto visualmente (clase sr-only). El correo va dentro de **una sola pill**:
     - contenedor en flex con gap de 8px, padding 6px 6px 6px 28px, `border: 1px solid #444`, radius de 40px y fondo `rgba(0,0,0,0.8)`;
     - `input type="email"`: placeholder "Tu correo", 48px de alto, sin borde, 17px;
     - botón primario "Contactar" de 48px de alto y padding 0 28px.
     - `:focus-within` del contenedor: `box-shadow: 0 0 0 1px #F2C94C, 0 0 30px rgba(242,201,76,0.25)`.
  4b. **WhatsApp** (agregado el 2026-10-09), debajo del formulario: pill outline de 48px de alto (padding 0 24px, borde `#444`, fondo `rgba(0,0,0,0.6)`) con el ícono de WhatsApp de línea en dorado (22px), la etiqueta "WhatsApp" (12px, tracking 0.25em, mayúsculas, #888) y el número (16px). Con número es un link a `https://wa.me/<número>` (nueva pestaña) con hover dorado y glow; sin número se muestra como texto. Datos en `whatsapp` de `src/data/site.ts` (hoy el marcador `[NÚMERO DE WHATSAPP]`).
  5. `<figure>` con margin-top de 32px, max-width de 620px y gap de 12px:
     - `<blockquote>` en Cinzel de 20px, lh 1.45: "“Llegamos con un demo grabado en el celular y salimos con un disco que suena como siempre lo imaginamos.”" (**texto provisional**, reemplazar por el testimonio real);
     - `<figcaption>`: "— Sofía M., artista", 14px, tracking 0.2em, mayúsculas, dorado.
  3b. **Aviso** (agregado el 2026-10-09) bajo el párrafo: caja de máx. 560px, borde `#333`, radius 6px, fondo `rgba(0,0,0,0.75)`, padding 16px 22px, con un ícono de información dorado y el texto de 15px "Este formulario es para **pedir información**. Déjanos tu correo y un asesor se pondrá en contacto contigo." ("pedir información" en dorado).
  4c. Bajo la pill del correo: link "¿Ya quieres apartar fecha? **Reserva aquí →**" (14px, #bbb; la parte final en dorado) a `/reservar`.
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
  - **Izquierda**: 13 preguntas agrupadas en 4 categorías (cambio del 2026-10-09): Reservas y tiempos, Preparación y desarrollo, Servicios y procesos, Equipamiento y comodidades. Cada grupo lleva su título (`h2`, 12px, 600, tracking 0.3em, mayúsculas, dorado) y su propio `<ol>` con bordes `#333`; gap de 36px entre grupos (28px en móvil). La numeración 01–13 es continua. Cada una es un `<button aria-pressed>` con número (Cinzel 14px dorado), pregunta (17px) y una flecha dorada que solo se ve en la activa. La activa va en dorado, fondo `#0a0a0a` y padding izquierdo de 18px.
  - **Derecha**: tocadiscos y respuesta.
    - Disco de `min(560px, 100%)`, alineado a la derecha: surcos dorados al 25%, arco de reflejo y etiqueta dorada de r100 con "Pregunta / 04 / de 08". Al cambiar de pregunta el disco gira a `n × 72°` en 0.9s (`cubic-bezier(.3,.7,.2,1)`).
    - Brazo del tocadiscos arriba a la derecha (34% del ancho del disco).
    - Panel de respuesta (`aria-live="polite"`) que se monta 160px sobre el disco, con margen derecho de 120px: borde dorado, fondo `#050505` y glow. Lleva "Track 04 · Reservas y tiempos" (número y categoría), la pregunta (Cinzel 32px), la respuesta (17px, #bbb) y un pie con "¿Otra duda? Escríbenos →" (a `/contacto`) y el botón pill "Siguiente pregunta →".
- **Móvil**: el tocadiscos (260px) y la respuesta van primero y la lista debajo; al tocar una pregunta, la página se desplaza hasta la respuesta. El botón "Siguiente" ocupa todo el ancho.
- **Datos**: `src/data/faq.ts`, cada pregunta con su `category`; el orden del archivo define el de los grupos. Quedan marcadores `[..]` en "¿Cómo se paga?" (formas de pago, monto del anticipo) y "¿Cuánto tarda la entrega?" (días).

---

## 7.2 Estudio · "E2 · Tour con galería" (`/estudio`, canvas https://claude.ai/artifact/M88wr13gMQBEyreXax6dms)

Cambio del 2026-10-09. Componente `Studio.tsx`, datos en `src/data/studio.ts`.
- **Tour** (640px de alto; 600px en móvil), a todo el ancho con borde inferior `#333`:
  - foto de cada espacio a pantalla completa (sin `src`, un marcador con anillos y la etiqueta arriba a la derecha); al cambiar, las fotos se funden en 0.9s con un leve zoom de salida;
  - degradado negro de izquierda a derecha (en móvil, de arriba abajo) para leer el texto;
  - texto (máx. 620px): eyebrow "Estudio · Tour", h1 "Entra a la *Sala principal.*" (Cinzel 64px; 40px en móvil; el nombre en dorado), descripción y "Espacio 01 de 04 · [m²]";
  - controles abajo: ⏮ y ⏭ redondos de 56px (los mismos de la galería de artistas), 4 miniaturas con nombre ("01 · Sala principal"; en tablet y móvil solo el número) con las esquinas de visor M1 en la activa, y un botón de pausa/reanudar de 44px. En móvil las miniaturas van en su propia fila y los botones debajo.
  - **Avanza solo** cada 6s (`studioTourInterval`), con una barra dorada de 2px que se llena en la miniatura activa. Se pausa con el mouse encima, con el foco dentro, con el botón de pausa y siempre con `prefers-reduced-motion` (ahí tampoco aparece el botón). Mientras corre, el texto no se anuncia (`aria-live="off"`); en pausa sí.
- **Nosotros** (agregado el 2026-10-09, entre el tour y el video): grid 6fr / 5fr con gap de 80px (una columna en tablet y móvil), borde inferior `#222`.
  - Izquierda: eyebrow "Nosotros", h2 "Pensado por músicos, *para músicos.*" (del eslogan) y dos párrafos de 17px en #bbb (máx. 620px) sobre quiénes somos (`studioAbout`).
  - Derecha: 3 principios numerados 01–03 (número Cinzel dorado, título Cinzel 22px y descripción de 15px), separados por líneas `#333` (`studioValues`). Debajo, las cifras del hero (`src/data/stats.ts`): número Cinzel 44px dorado con glow (34px en móvil) sobre su etiqueta en mayúsculas #888.
- **Video y live sessions** (agregado el 2026-10-09, entre el tour y el equipo): eyebrow "Video y live sessions", h2 "Tu música *también se ve.*" y un párrafo a la derecha. Dos tarjetas (Videos musicales · Live Sessions; una columna en tablet y móvil):
  - pantalla 16:9 con la muestra de video (sin `embed`, marcador "[VIDEO DE MUESTRA: …]"), etiqueta pill dorada ("Videoclip" / "En vivo") y el botón de play P2 con ondas; con `embed`, el play carga el iframe;
  - título (Cinzel 30px), descripción, proceso en 5 pasos con línea dorada arriba (3 columnas en móvil) y lista "incluye" con ◆.
  - Botones al final: "Cotizar un video" (a `/servicios?vista=paquetes`, la vista de paquetes) y "Reservar sesión" (a `/reservar`).
  - Datos en `studioVideo` (`src/data/studio.ts`).
- **Equipo**: grid 4fr / 8fr. A la izquierda, eyebrow, "Todo conectado, *listo para tocar.*" y la nota "Si prefieres tu propio equipo, tráelo…". A la derecha, pestañas (`role="tablist"`, flechas ← → para moverse; activa en dorado con subrayado) para Micrófonos, Preamps y consola, Monitores, Backline, Software y Video; el panel muestra foto (240×180) y la descripción. En móvil las pestañas hacen scroll horizontal.
- **Visita**: "Ven a *escucharlo.*" con los botones "Reservar sesión" (a `/reservar`) y "Agendar visita" (a `/contacto`).
  - Debajo, grid 8fr / 4fr con gap de 24px (una columna en tablet y móvil):
    - **mapa** (agregado el 2026-10-09): Google Maps embebido (sin API key) con las coordenadas de `studioMap` (`src/data/studio.ts`), mín. 420px de alto (300px en móvil), borde `#333` y radius de 6px; en tonos oscuros con un filtro (`invert` + `hue-rotate(180deg)`, el pin sigue rojo). Mientras `example: true`, lleva la etiqueta pill dorada "Ubicación de ejemplo";
    - a la derecha, las 3 tarjetas apiladas (Ubicación, Horario y Llegada; en 3 columnas en tablet) y el botón outline dorado "Cómo llegar →", que abre la ruta en Google Maps en otra pestaña.

---

## 7.3 Opiniones (`/opiniones`, canvas https://claude.ai/artifact/R7Esqtm9Mbfyo4s5KyY7Du)

Cambio del 2026-10-09. En el nav va después de Artistas (Servicios · Artistas · Opiniones). Datos en `src/data/reviews.ts`.
- **Página** (`Reviews.tsx`): cabecera 7fr / 5fr con eyebrow "Opiniones", h1 "Lo que dicen *quienes ya grabaron.*" y un párrafo; a la derecha, tarjeta de resumen con el promedio (Cinzel 64px dorado), estrellas, total, barras por calificación (5 a 1) y el botón primario "Deja tu opinión ★". Debajo, filtros por servicio (pills `aria-pressed`, "Todas" + los servicios que tengan opiniones) y una grilla de 3 columnas (2 en tablet, 1 en móvil) con tarjetas: estrellas, etiqueta del servicio, cita en Cinzel 18px, nombre y proyecto.
- **Ventana "Deja tu opinión"** (`ReviewModal.tsx`, portal): "Opiniones" + glifo de temporada, "¿Cómo sonó *tu experiencia?*" y "La revisamos antes de publicarla." Estrellas de 1 a 5 (`radiogroup`, 52px, se iluminan al pasar el mouse, flechas del teclado) con su texto: *Desafinado · Le falta mezcla · Suena bien · Suena muy bien · ¡Disco de oro!*; nombre, banda o proyecto (opcional), servicio (`contactTopics`), opinión (máx. 500 con contador) y "Pueden publicar mi opinión con mi nombre". Sin estrellas no se envía ("Elige cuántas estrellas le das"). Al enviar: estrellas iluminadas, "¡Gracias por *tu frecuencia!*" y botón Cerrar. Se cierra con la ✕, clic fuera o Escape. En móvil sube como hoja desde abajo. En temporada toma el borde, glow y anillos del color del mes, el glifo y el mensaje del mes. `/opiniones?opinar=1` la abre al llegar.
- **Contacto**: el testimonio fijo se cambió por la rotación de opiniones (`ReviewsRotator.tsx`): cada 6s (`reviewRotateMs`) cambia con fundido; estrellas, cita en Cinzel 20px y "— Nombre · Servicio"; puntos para elegir una (se queda en esa), barra de tiempo, y el link "¿Ya grabaste con nosotros? *Deja tu opinión →*" a `/opiniones?opinar=1`. Se pausa con el mouse encima, con el foco dentro y con reduced-motion.
- **Datos**: el envío está simulado (`submitReview`); la tabla `reviews` (migración `reviews`) guarda calificación, nombre, proyecto, servicio, texto, permiso y estado `pending/published/rejected`. Solo se muestran las opiniones de `reviews.ts`.

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
- **Estudio · mapa**: las coordenadas de `studioMap` son un punto de ejemplo (Roma Norte, CDMX); faltan las reales y quitar `example`.
- **Estudio**: el texto de Nosotros es un borrador hecho con el eslogan y las cifras; falta la historia real (fundadores, año, ciudad). Faltan también las fotos de los espacios y del equipo, videos de muestra (`embed`), medidas, modelos y datos de visita (marcadores `[..]` en `src/data/studio.ts`). "Agendar visita" lleva a `/contacto` mientras no haya un flujo propio.
- **Envíos**: falta definir a dónde van el formulario de contacto y la reserva (backend o servicio).
- **Calendario**: la disponibilidad y la navegación entre meses son estáticas en el diseño.
- **Redes**: Contacto repite los links que también aparecen en el Footer (decisión abierta).
- **Opiniones**: las 3 de `src/data/reviews.ts` son provisionales (como el testimonio de Sofía M.); hay que reemplazarlas por opiniones reales aprobadas y definir quién las revisa.
- **Artistas y FAQ**: faltan las bios, redes (links), videos y fotos reales de los artistas, y los datos que faltan en dos respuestas de FAQ (marcadores `[..]` de pago y tiempo de entrega).
- **Nav**: el rango 768–1199px usa el nav móvil (hamburguesa) porque con FAQs no cabe el nav completo; no hay diseño específico de tablet.
- **Tablet**: no hay diseño para 768–1200px; se usa el layout desktop fluido.
- **Paquetes**: faltan los paquetes reales (nombres, contenido, precios, IVA, tiempos de entrega y sesiones); hoy son una propuesta con marcadores `[..]`. "Reservar este paquete" lleva a `/reservar` sin preseleccionar el paquete. (Ya existe el enlace directo `/servicios?vista=paquetes`.)
