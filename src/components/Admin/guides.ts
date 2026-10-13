/**
 * Guías del panel (G5 escritorio · M2 móvil, canvas https://claude.ai/artifact/MRy3XXqgzhDDSbybSLkP7b):
 * el alien del estudio narra cada módulo y se ilumina la parte de la pantalla que explica.
 * Cada paso apunta a un selector CSS; si no está en pantalla (otro tamaño u otro rol), el paso se salta.
 * Al agregar algo importante a una vista, súmale su paso aquí (y un `data-guide` si no tiene clase propia).
 */

/** El elemento existe y se ve (otro tamaño de pantalla u otro rol lo pueden ocultar) */
export function guideTargetVisible(selector: string): boolean {
  const el = document.querySelector(selector)
  if (!el) return false
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
}

export interface GuideStep {
  /** Qué se ilumina; sin `target`, el paso es de bienvenida (todo oscuro) */
  target?: string
  say: string
  text: string
  tip?: string
}

export interface Guide {
  key: string
  /** "Guía de Agenda" */
  name: string
  steps: GuideStep[]
}

const HELP = '[data-guide="help"]'
const help = (name: string): GuideStep => ({
  target: HELP,
  say: `¡Listo, ya conoces ${name}!`,
  text: 'Si se te olvida algo, aquí abajo me llamas otra vez.',
})

export const GUIDES: Record<string, Guide> = {
  inicio: {
    key: 'inicio',
    name: 'Inicio',
    steps: [
      { say: '¡Hola! Soy el alien del estudio.', text: 'Te enseño el Inicio, el resumen del estudio cada mañana. Puedes saltarte la guía cuando quieras.' },
      { target: '.hf-dash__hello', say: 'Así empieza tu día.', text: 'La fecha, tu saludo y cuántas sesiones hay hoy. En cumpleaños y temporadas también te enteras aquí.' },
      { target: '.hf-dash__today', say: 'Lo de hoy, por hora.', text: 'Cada horario del día: libre, por confirmar o con su sesión. "Ver agenda" te lleva al detalle.' },
      { target: '.hf-dash__todo', say: 'Esto espera tu respuesta.', text: 'Reservas por confirmar, opiniones por publicar y contactos sin atender. Atiéndelos desde aquí mismo.' },
      { target: '.hf-dash__knob', say: '¿Semana, mes o año?', text: 'Elige el periodo y abajo cambian reservas, ingresos, opiniones y visitas, comparadas con el periodo anterior.' },
      { target: '.hf-admin__tabs', say: 'Y estas son tus secciones.', text: 'Los números dorados te avisan lo pendiente en cada una.' },
      help('el Inicio'),
    ],
  },
  agenda: {
    key: 'agenda',
    name: 'Agenda',
    steps: [
      { say: '¡Hola! Soy el alien del estudio.', text: 'Te enseño la Agenda: reservas, bloqueos y sesiones día por día. Puedes saltarte la guía cuando quieras.' },
      // Escritorio (R2)
      { target: '.hf-pistas__board', say: 'Aquí vive la agenda.', text: 'Cada fila es un día y cada cuadro un horario. Dorado: confirmada. Borde dorado: por confirmar. Rayado: bloqueado.', tip: 'Toca un hueco libre para bloquearlo, o un bloqueo para liberarlo.' },
      { target: '.hf-agenda__detail', say: 'Aquí ves la sesión que toques.', text: 'Quién la pidió y su teléfono. Desde aquí la confirmas, capturas el cobro o la cancelas.' },
      { target: '[data-guide="agenda-new"]', say: '¿Te llamaron para grabar?', text: 'Agéndala tú: eliges día y hora libres y queda confirmada. El correo es opcional.' },
      { target: '.hf-bsearch', say: '¿No encuentras una reserva?', text: 'Búscala por proyecto, nombre, correo o teléfono, de cualquier fecha. La Agenda salta a ese día y la abre.' },
      { target: '.hf-pistas__nav', say: 'Para moverte…', text: 'Las flechas avanzan o regresan, y "Hoy" te devuelve al día de hoy.' },
      { target: '.hf-pistas__seg', say: '¿Cuántos días ves?', text: '7, 14 o 30 días a la vez.' },
      { target: '.hf-pistas__tools .hf-admin__filters', say: 'Y qué se ve.', text: 'Prende o apaga reservas, bloqueos y huecos libres para leer la agenda más fácil.' },
      // Móvil (R1)
      { target: '.hf-magenda__strip', say: 'Estos son tus días.', text: 'Desliza la tira para cambiar de día; los puntos marcan sesiones. "Ver mes" abre dos meses completos.' },
      { target: '.hf-magenda__dayactions', say: '¿Te llamaron para grabar?', text: '"+ Agendar" la deja confirmada; "Cerrar el día" bloquea todos sus horarios.' },
      { target: '.hf-magenda__slots', say: 'Y aquí, los horarios del día.', text: 'Toca un hueco para bloquearlo o una sesión para verla, confirmarla o cobrarla.' },
      help('la Agenda'),
    ],
  },
  opiniones: {
    key: 'opiniones',
    name: 'Opiniones',
    steps: [
      { say: '¡Hola! Soy el alien del estudio.', text: 'Te enseño Opiniones: lo que escriben quienes grabaron aquí. Solo las que publiques salen en la web.' },
      { target: '.hf-admin__head .hf-admin__filters', say: 'Primero, qué quieres ver.', text: 'Pendientes, publicadas o rechazadas, con cuántas hay de cada una. Se abre en Pendientes.' },
      { target: '.hf-areviews__card', say: 'Cada opinión, en su tarjeta.', text: 'Estrellas, lo que escribió, quién y de qué servicio. Si no autorizó su nombre, en la web sale como "Anónimo".' },
      { target: '.hf-areviews__actions', say: 'Tú decides qué se publica.', text: 'Publícala o recházala. Ocultar la quita de la web sin borrarla; Borrar la elimina para siempre.' },
      help('Opiniones'),
    ],
  },
  contactos: {
    key: 'contactos',
    name: 'Contactos',
    steps: [
      { say: '¡Hola! Soy el alien del estudio.', text: 'Te enseño Contactos: quienes pidieron información desde la web.' },
      { target: '.hf-acontacts__filters', say: '¿Buscas a alguien?', text: 'Por nombre, correo o teléfono, y filtra por el tema que preguntó.' },
      { target: '.hf-acontacts__table', say: 'Aquí están todos.', text: 'Nombre, tema, teléfono y correo. Toca el teléfono para llamar o "Responder" para escribirle.' },
      { target: '.hf-acontacts__check', say: '¿Ya le respondiste?', text: 'Márcalo como atendido: se apaga en la lista y deja de contar como pendiente.' },
      help('Contactos'),
    ],
  },
  sitio: {
    key: 'sitio',
    name: 'Sitio',
    steps: [
      { say: '¡Hola! Soy el alien del estudio.', text: 'Te enseño Sitio: aquí apagas partes de la web sin borrarlas.' },
      { target: '.hf-asite__window', say: 'Esta es la web de verdad.', text: 'Cada bloque lleva su switch. Lo que apagues queda en borrador: la web no cambia hasta que publiques.' },
      { target: '.hf-asite__tabs', say: 'Cambia de página.', text: 'Una página apagada sigue en el menú, pero al entrar se ve "Próximamente".' },
      { target: '.hf-asite__tools', say: 'Globales y dispositivo.', text: 'En Globales apagas cosas de toda la web, como el platillo o las temporadas. Mírala también en móvil.' },
      { target: '.hf-asite__actions', say: 'Publicar, y la emergencia.', text: 'Publicar sube tus cambios; Historial y Descartar te dejan regresar. "Mantenimiento" apaga la web completa al instante.' },
      help('Sitio'),
    ],
  },
  contenido: {
    key: 'contenido',
    name: 'Contenido',
    steps: [
      { say: '¡Hola! Soy el alien del estudio.', text: 'Te enseño Contenido: los textos, precios, artistas y preguntas de la web, sin tocar código.' },
      { target: '.hf-acontent__tabs', say: 'Elige la sección.', text: 'Servicios, paquetes, precios, horarios, artistas, preguntas, estudio y datos del sitio. El punto dorado marca cambios sin publicar.' },
      { target: '.hf-acontent__list', say: 'Lo que tiene esa sección.', text: 'Toca un elemento para editarlo; con las flechas cambias su orden. Algunas listas tienen buscador.' },
      { target: '.hf-acontent__form', say: 'Aquí lo editas.', text: 'Todo se guarda solo como borrador mientras escribes. Los errores se marcan en dorado.' },
      { target: '.hf-acontent__preview', say: 'Y así se ve.', text: 'La vista previa muestra tu borrador en la web antes de publicarlo.' },
      { target: '.hf-acontent__bar', say: 'Cuando esté listo, publícalo.', text: 'Ahí ves si hay cambios sin publicar. Historial guarda cada versión por si quieres regresar.' },
      help('Contenido'),
    ],
  },
  plugins: {
    key: 'plugins',
    name: 'Plugins',
    steps: [
      { say: '¡Hola! Soy el alien del estudio.', text: 'Te enseño Plugins: lo que sale en la página /plugins de la web, sus versiones y cuánto se descargan.' },
      { target: '[data-guide="plugins-kpis"]', say: '¿Cómo van?', text: 'Descargas de los últimos 30 días, el más descargado, cuántos están en beta y las visitas a /plugins.' },
      { target: '[data-guide="plugins-list"]', say: 'Todos los plugins.', text: 'Toca uno para abrirlo. La barra dorada son sus descargas del mes; "Borrador" marca lo que aún no publicas.' },
      { target: '[data-guide="plugins-tabs"]', say: 'Ficha y Versiones.', text: 'En la Ficha editas lo que se ve en la web. En Versiones subes cada instalador y marcas cuál es la actual: esa es la que se descarga.', tip: 'Si pones un link de tienda en la Ficha, el botón de la web lleva ahí en vez de descargar.' },
      { target: '[data-guide="plugins-publish"]', say: 'Cuando esté listo, publícalo.', text: 'La ficha se guarda sola como borrador. Las versiones no: se aplican al guardarlas.' },
      help('Plugins'),
    ],
  },
  usuarios: {
    key: 'usuarios',
    name: 'Usuarios',
    steps: [
      { say: '¡Hola! Soy el alien del estudio.', text: 'Te enseño Usuarios: quién entra al panel y qué ve.' },
      { target: '[data-guide="users-list"]', say: 'Todo el equipo.', text: 'Cada quien con su usuario, rol y cumpleaños. "Editar" cambia sus datos y su rol; "Nueva temporal" le da otra contraseña si la perdió.' },
      { target: '[data-guide="users-new"]', say: '¿Llega alguien nuevo?', text: 'Su usuario y una contraseña temporal se generan solos. La ves aquí hasta que entre y ponga la suya en su bienvenida.', tip: 'Admin ve todo; a Staff le eliges qué vistas ve, y siempre tiene Mi cuenta.' },
      { target: '[data-guide="users-me"]', say: 'Tu cuenta.', text: 'Cambia tu contraseña cuando quieras.' },
      { target: '[data-guide="users-2fa"]', say: 'Tu segundo candado.', text: 'La verificación en dos pasos pide, además de tu contraseña, un código de Google Authenticator o Authy. Para Admin es obligatoria.', tip: 'Guarda tus códigos de respaldo: son tu entrada si pierdes el teléfono.' },
      { target: '[data-guide="users-sessions"]', say: '¿Dónde está abierta tu cuenta?', text: 'Si ves una sesión que no reconoces, ciérrala y cambia tu contraseña.' },
      { target: '[data-guide="users-log"]', say: 'Y quién ha entrado.', text: 'Cada intento de entrar, bueno o fallido. Tras 5 fallidos seguidos, la cuenta se bloquea 15 minutos.' },
      help('esta sección'),
    ],
  },
}

/** Qué guía corresponde a una ruta del panel */
export function guideFor(pathname: string): Guide | null {
  const map: Record<string, string> = {
    '/admin': 'inicio',
    '/admin/reservas': 'agenda',
    '/admin/opiniones': 'opiniones',
    '/admin/contactos': 'contactos',
    '/admin/sitio': 'sitio',
    '/admin/contenido': 'contenido',
    '/admin/plugins': 'plugins',
    '/admin/usuarios': 'usuarios',
  }
  const key = map[pathname.replace(/\/+$/, '') || '/admin']
  return key ? GUIDES[key] : null
}
